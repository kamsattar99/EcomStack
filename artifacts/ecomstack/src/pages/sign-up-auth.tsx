import { ArrowLeft, Check, MessageCircle, Sparkles } from "lucide-react";
import { SignUp, useUser } from "@clerk/react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { AppLogo } from "@/components/app-logo";
import { SignupResourceIllustration } from "@/components/signup-resource-illustration";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpAuthPage() {
  const { isSignedIn } = useUser();
  const [location, setLocation] = useLocation();
  const isVerifyingEmail = /verify|verification|factor/i.test(location);
  useEffect(() => {
    if (isSignedIn) setLocation("/unlock");
  }, [isSignedIn, setLocation]);

  if (isSignedIn) return null;

  return (
    <div className="signup-page min-h-[100dvh] overflow-hidden bg-[#FBFCFA] px-4 py-4 text-[#14251F] sm:px-6 sm:py-6">
      <PageMeta
        title={isVerifyingEmail ? "Check your email | EcomStack" : "Create your EcomStack account"}
        description={isVerifyingEmail
          ? "Enter the verification code to continue to the EcomStack resource vault."
          : "Create your EcomStack account to access ecommerce prompts, skills and cheat sheets."}
      />
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="flex h-14 items-center justify-between rounded-full border border-[#dfe7df] bg-white/90 px-4 shadow-[0_10px_35px_rgba(20,37,31,0.08)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#14251F]">
            <AppLogo className="h-7 w-7 shrink-0 rounded-lg" />
            EcomStack
          </Link>
          <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-medium text-[#65756d] hover:text-[#193c36]">
            <ArrowLeft className="h-4 w-4" />
            Edit details
          </Link>
        </header>

        <main className="relative flex min-h-[calc(100dvh-104px)] items-center justify-center py-10 sm:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 hidden w-56 -translate-y-1/2 -translate-x-3 opacity-90 xl:block">
            <SignupResourceIllustration className="signup-float" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 hidden w-56 -translate-y-1/2 translate-x-3 scale-x-[-1] opacity-90 xl:block">
            <SignupResourceIllustration className="signup-float signup-float-delayed" />
          </div>
          <section className="signup-enter signup-form relative z-10 w-full max-w-[590px]">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c]">
              <span className="text-[#193C36]">Account</span><span aria-hidden="true">→</span><span>Shopify</span><span aria-hidden="true">→</span><span>Vault</span>
            </div>
            <div aria-hidden="true" className="mb-4 flex justify-center gap-2 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F1E6] text-[#193C36] shadow-sm"><MessageCircle className="h-4 w-4" /></span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#2F765F] shadow-sm ring-1 ring-[#dfe7df]"><Sparkles className="h-4 w-4" /></span>
            </div>
            <h1 className="mx-auto max-w-[520px] text-center font-serif text-[2.25rem] leading-[1.03] tracking-[-0.045em] text-[#14251F] sm:text-[2.7rem]">
              {isVerifyingEmail ? "Check your email." : "Create your EcomStack account."}
            </h1>
            <p className="mx-auto mt-3 max-w-[470px] text-center text-sm leading-6 text-[#607069] sm:text-base">
              {isVerifyingEmail
                ? "Enter the verification code we sent to your email address."
                : "Access prompts, skills and cheat sheets for ecommerce and digital products."}
            </p>
            <div className="mt-6">
              <SignUp
                routing="path"
                path={`${basePath}/sign-up/auth`}
                signInUrl={`${basePath}/sign-in`}
                fallbackRedirectUrl={`${basePath}/unlock`}
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "!w-full !max-w-[590px] !overflow-hidden !rounded-[24px] !border !border-[#dfe7df] !bg-white !shadow-[0_18px_50px_rgba(25,60,54,0.10)]",
                    card: "!w-full !rounded-none !border-0 !bg-transparent !p-8 !shadow-none max-sm:!p-5",
                    header: "!hidden",
                    logoBox: "!hidden",
                    socialButtonsBlock: "!grid !grid-cols-2 !gap-3 max-sm:!gap-2",
                    socialButtonsBlockButton: "!min-h-[52px] !justify-center",
                    formFieldInput: "!min-h-[52px]",
                    formButtonPrimary: "!mt-1 !min-h-[54px]",
                    footer: "!border-0 !bg-transparent !px-8 !pb-7 !pt-0 !shadow-none max-sm:!px-5 max-sm:!pb-[22px]",
                  },
                }}
              />
            </div>
          </section>
        </main>
      </div>
      <style>{`
        .signup-enter { animation: signup-rise .55s cubic-bezier(.22,.8,.26,1) both; } .signup-form { animation-delay: .1s; }
        .signup-float { animation: signup-float 6.5s ease-in-out infinite; }
        .signup-float-delayed { animation-delay: -3.2s; }
        @keyframes signup-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes signup-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .signup-enter,.signup-float { animation:none !important; } }
      `}</style>
    </div>
  );
}