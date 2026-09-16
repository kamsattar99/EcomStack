import { useEffect, useRef, useState } from "react";
import { useStartClaim, useCompleteOnboarding, useGetMember, getGetMemberQueryKey, useUpdateMemberProfile } from "@workspace/api-client-react";
import type { MemberProfileInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

const SHOPIFY_FALLBACK_URL = "https://shopify.pxf.io/the-ecom-king";
type PendingProfile = Omit<MemberProfileInput, "email">;

export default function UnlockPage() {
  const { isLoaded: clerkLoaded, user } = useUser();
  const { data: member, isLoading: memberLoading } = useGetMember({ query: { queryKey: getGetMemberQueryKey() } });
  const startClaim = useStartClaim();
  const completeOnboarding = useCompleteOnboarding();
  const updateMemberProfile = useUpdateMemberProfile();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [signupError, setSignupError] = useState("");
  const [signupUrl, setSignupUrl] = useState("");
  const pendingProfile = useRef<PendingProfile | null>(null);
  const profileSyncStarted = useRef(false);
  const [profileStatus, setProfileStatus] = useState<"loading" | "ready" | "error">("loading");
  const { toast } = useToast();

  const savePendingProfile = () => {
    const profile = pendingProfile.current;
    if (!profile) { setProfileStatus("ready"); return; }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) { setProfileStatus("error"); return; }
    profileSyncStarted.current = true;
    setProfileStatus("loading");
    updateMemberProfile.mutate({ data: { ...profile, email } }, {
      onSuccess: () => {
        try { sessionStorage.removeItem("pendingRegistrationDetails"); } catch {}
        pendingProfile.current = null;
        setProfileStatus("ready");
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey() });
      },
      onError: () => setProfileStatus("error"),
    });
  };

  useEffect(() => {
    if (!clerkLoaded || profileSyncStarted.current) return;
    try {
      const raw = sessionStorage.getItem("pendingRegistrationDetails");
      pendingProfile.current = raw ? JSON.parse(raw) as PendingProfile : null;
    } catch {
      pendingProfile.current = null;
    }
    savePendingProfile();
  }, [clerkLoaded]);

  useEffect(() => {
    if (!memberLoading && member?.onboardingCompleted) setLocation("/dashboard");
  }, [member?.onboardingCompleted, memberLoading, setLocation]);

  if (profileStatus !== "ready") {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-16">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            {profileStatus === "loading" ? (
              <>
                <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-primary" />
                <h1 className="text-xl font-medium">Saving your member details</h1>
                <p className="mt-2 text-sm text-muted-foreground">Your verified account will be ready in a moment.</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-medium">We couldn't save your details</h1>
                <p className="mt-2 text-sm text-muted-foreground">We couldn't confirm a verified email for this account. Please try again.</p>
                <div className="mt-6 flex flex-col gap-3">
                  <Button onClick={savePendingProfile}>Try again</Button>
                  <Button asChild variant="outline"><Link href="/sign-up">Edit your details</Link></Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStart = () => {
    setSignupError("");
    setSignupUrl("");
    const partnerTab = window.open("about:blank", "_blank");
    if (partnerTab) partnerTab.opener = null;
    let resourceSlug: string | undefined;
    try { resourceSlug = sessionStorage.getItem('pendingResourceSlug') || undefined; }
    catch { /* Storage restrictions must not prevent a tracked signup. */ }

    startClaim.mutate({ data: { resourceSlug } }, {
      onSuccess: (result) => {
        if (partnerTab && !partnerTab.closed) {
          try { partnerTab.location.replace(result.redirectUrl); }
          catch {
            partnerTab.close();
            setSignupUrl(SHOPIFY_FALLBACK_URL);
            setSignupError("We couldn't open the tracked Shopify link. Use the backup link below to continue.");
          }
        } else {
          setSignupUrl(SHOPIFY_FALLBACK_URL);
          setSignupError("Your browser blocked the new tab. Use the backup link below to continue.");
        }
      },
      onError: () => {
        if (partnerTab && !partnerTab.closed) partnerTab.close();
        setSignupUrl(SHOPIFY_FALLBACK_URL);
        setSignupError("We couldn't open the tracked Shopify link. Use the backup link below to continue.");
      }
    });
  };

  const handleContinue = () => {
    completeOnboarding.mutate(undefined, {
      onSuccess: () => {
        let resourceSlug: string | null = null;
        try { resourceSlug = sessionStorage.getItem('pendingResourceSlug'); }
        catch {}
        try {
          sessionStorage.removeItem('pendingResourceSlug');
          sessionStorage.removeItem('pendingIntent');
        } catch {}
        queryClient.invalidateQueries({ queryKey: getGetMemberQueryKey() });
        if (resourceSlug) {
          setLocation(`/resources/${resourceSlug}`);
        } else {
          setLocation("/dashboard");
        }
      },
      onError: () => {
        toast({ variant: "destructive", title: "Something went wrong", description: "Please try again." });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
      <PageMeta title="Start your Shopify store" />

      <div className="mb-8 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>1. Your details</span>
        <span aria-hidden="true">→</span>
        <span className="text-primary">2. Start Shopify</span>
        <span aria-hidden="true">→</span>
        <span>3. Open the vault</span>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-foreground">
          Start your Shopify store.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Set up your store so you can follow along and put your EcomStack resources into action.
        </p>
      </div>

      <div className="grid gap-8 items-start mb-12">
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <CardContent className="p-8 md:p-10 space-y-10">
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base font-medium shrink-0">1</div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground text-lg mb-2">Start Shopify through our link</h4>
                <p className="text-muted-foreground mb-6">
                  Shopify opens in a new tab, so you can keep this guide open while you set up.
                </p>
                <div className="space-y-4 max-w-sm">
                  <Button
                    size="lg"
                    className="w-full shadow-sm text-base h-12"
                    onClick={handleStart}
                    disabled={startClaim.isPending}
                  >
                    {startClaim.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ExternalLink className="mr-2 h-5 w-5" />}
                    Start Shopify through our link
                  </Button>
                  <p className="text-xs text-center text-muted-foreground italic">
                    We may earn a commission if you sign up through this link.
                  </p>

                  {signupError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTitle>Couldn't open Shopify</AlertTitle>
                      <AlertDescription>{signupError}</AlertDescription>
                    </Alert>
                  )}
                  {signupUrl && (
                    <div className="w-full text-center mt-4">
                      <p className="text-sm text-muted-foreground mb-2">If nothing opened, use the backup link:</p>
                      <a href={signupUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-primary font-medium hover:underline underline-offset-4">
                        Open Shopify signup
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-base font-medium shrink-0">2</div>
              <div>
                <h4 className="font-medium text-foreground text-lg mb-2">Follow Shopify's signup steps</h4>
                <p className="text-muted-foreground">
                  Follow Shopify’s signup steps, then return here to explore your resources.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-base font-medium shrink-0">3</div>
              <div>
                <h4 className="font-medium text-foreground text-lg mb-2">Return to EcomStack</h4>
                <p className="text-muted-foreground">Your EcomStack vault is ready when you are.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        <Button
          variant="default"
          size="lg"
          onClick={handleContinue}
          disabled={completeOnboarding.isPending}
          className="rounded-full px-10 h-14 text-base shadow-sm hover:shadow-md transition-all"
        >
          {completeOnboarding.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Continue to the vault
          {!completeOnboarding.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
        <button
          onClick={handleContinue}
          disabled={completeOnboarding.isPending}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors mt-4"
        >
          Continue without starting Shopify
        </button>
      </div>
    </div>
  );
}
