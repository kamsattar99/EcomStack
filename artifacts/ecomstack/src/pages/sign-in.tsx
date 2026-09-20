import { SignIn } from "@clerk/react";
import { Link } from "wouter";
import { AuthIllustration } from "@/components/auth-illustration";
import { PageMeta } from "@/components/page-meta";
import { AppLogo } from "@/components/app-logo";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <div className="auth-page min-h-[100dvh] overflow-hidden bg-[#FBFCFA] px-4 py-4 text-[#14251F] sm:px-6 sm:py-6">
      <PageMeta title="Sign in to EcomStack" description="Sign in to access your EcomStack Vault." />
      <div className="mx-auto w-full max-w-[1080px]">
        <header className="flex h-14 items-center justify-between rounded-full border border-[#dfe7df] bg-white/90 px-4 shadow-[0_10px_35px_rgba(20,37,31,0.08)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#14251F]">
            <AppLogo className="h-7 w-7 shrink-0 rounded-lg" />
            EcomStack
          </Link>
          <Link href="/sign-up" className="text-sm font-semibold text-[#52645d] transition-colors hover:text-[#193C36]">Create account</Link>
        </header>

        <main className="grid items-center gap-10 pb-8 pt-11 lg:grid-cols-[1fr_460px] lg:gap-16 lg:pt-16">
          <section className="auth-enter hidden lg:block">
            <p className="text-xs font-bold tracking-[0.18em] text-[#2F765F]">YOUR ECOMSTACK VAULT</p>
            <h1 className="mt-5 max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.05em] text-[#14251F]">Your next useful resource is waiting.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#607069]">Pick up where you left off with prompts, skills and cheat sheets for your ecommerce work.</p>
            <AuthIllustration className="auth-float mt-7" />
          </section>

          <section className="auth-enter auth-form">
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c]">
              <span className="text-[#193C36]">Account</span><span aria-hidden="true">→</span><span>Shopify</span><span aria-hidden="true">→</span><span>Vault</span>
            </div>
            <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} />
          </section>
        </main>
      </div>
      <style>{`
        .auth-enter { animation: auth-rise .55s cubic-bezier(.22,.8,.26,1) both; } .auth-form { animation-delay:.1s; }
        .auth-float { animation: auth-float 6.5s ease-in-out infinite; }
        @keyframes auth-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes auth-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .auth-enter,.auth-float { animation:none !important; } }
      `}</style>
    </div>
  );
}