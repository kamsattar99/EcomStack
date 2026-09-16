import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SignUp, useUser } from "@clerk/react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpAuthPage() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isSignedIn) setLocation("/unlock");
  }, [isSignedIn, setLocation]);

  if (isSignedIn) return null;

  return (
    <div className="min-h-[100dvh] bg-[#f4f6f1] px-4 py-8 text-[#17231f] sm:px-6 sm:py-12">
      <PageMeta
        title="Verify your EcomStack account"
        description="Verify your EcomStack account to open the EcomStack resource vault."
      />
      <div className="mx-auto w-full max-w-[1020px]">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[0.16em] text-[#193c36]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#193c36] text-[#d7ef9b]">E</span>
            ECOMSTACK
          </Link>
          <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-medium text-[#65756d] hover:text-[#193c36]">
            <ArrowLeft className="h-4 w-4" />
            Edit details
          </Link>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(260px,0.8fr)_minmax(380px,440px)] lg:gap-20">
          <div className="pt-4">
            <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6c7b72]">
              <span className="text-[#193c36]">1. Your details</span>
              <span aria-hidden="true">→</span>
              <span>2. Start Shopify</span>
              <span aria-hidden="true">→</span>
              <span>3. Open the vault</span>
            </div>
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#dceab9] text-[#193c36]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-4xl leading-[1.05] tracking-[-0.04em] text-[#193c36] sm:text-5xl">
              One quick check, then you are in.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-[#607069]">
              Confirm your email to keep your account secure. Your details are saved while you complete this step.
            </p>
          </div>

          <div className="rounded-2xl border border-[#d5dfd4] bg-[#fbfcf8] p-4 shadow-[0_18px_50px_rgba(25,60,54,0.08)] sm:p-6">
            <SignUp
              routing="path"
              path={`${basePath}/sign-up/auth`}
              signInUrl={`${basePath}/sign-in`}
              fallbackRedirectUrl={`${basePath}/unlock`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}