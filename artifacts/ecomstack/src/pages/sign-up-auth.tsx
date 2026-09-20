import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SignUp, useUser } from "@clerk/react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";
import { AppLogo } from "@/components/app-logo";
import { SignupResourceIllustration } from "@/components/signup-resource-illustration";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpAuthPage() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isSignedIn) setLocation("/unlock");
  }, [isSignedIn, setLocation]);

  if (isSignedIn) return null;

  return (
    <div className="signup-page min-h-[100dvh] overflow-hidden bg-[#FBFCFA] px-4 py-4 text-[#14251F] sm:px-6 sm:py-6">
      <PageMeta
        title="Verify your EcomStack account"
        description="Verify your EcomStack account to open the EcomStack resource vault."
      />
      <div className="mx-auto w-full max-w-[1080px]">
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

        <div className="grid items-center gap-10 pb-8 pt-11 lg:grid-cols-[1fr_460px] lg:gap-16 lg:pt-16">
          <section className="signup-enter hidden lg:block">
            <p className="text-xs font-bold tracking-[0.18em] text-[#2F765F]">ALMOST THERE</p>
            <h1 className="mt-5 max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.05em] text-[#14251F]">Your resources are waiting.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#607069]">Confirm your email, then you can explore EcomStack and put the resources to work.</p>
            <SignupResourceIllustration className="signup-float mt-7" />
          </section>
          <section className="signup-enter signup-form">
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c]">
              <span className="text-[#193C36]">Account</span><span aria-hidden="true">→</span><span>Shopify</span><span aria-hidden="true">→</span><span>Vault</span>
            </div>
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#E8F1E6] text-[#193C36]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.04em] text-[#14251F] sm:text-[2.7rem]">
              One quick check, then you are in.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-[#607069]">
              Confirm your email to keep your account secure. Your details are saved while you complete this step.
            </p>
            <div className="mt-6">
            <SignUp
              routing="path"
              path={`${basePath}/sign-up/auth`}
              signInUrl={`${basePath}/sign-in`}
              fallbackRedirectUrl={`${basePath}/unlock`}
            />
            </div>
          </section>
        </div>
      </div>
      <style>{`
        .signup-enter { animation: signup-rise .55s cubic-bezier(.22,.8,.26,1) both; } .signup-form { animation-delay: .1s; }
        .signup-float { animation: signup-float 6.5s ease-in-out infinite; }
        @keyframes signup-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes signup-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .signup-enter,.signup-float { animation:none !important; } }
      `}</style>
    </div>
  );
}