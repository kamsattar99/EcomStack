import { ArrowRight, LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMeta } from "@/components/page-meta";
import { AppLogo } from "@/components/app-logo";
import { SignupResourceIllustration } from "@/components/signup-resource-illustration";

type RegistrationDetails = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

const initialDetails: RegistrationDetails = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
};

function savedDetails(): RegistrationDetails {
  try {
    const raw = sessionStorage.getItem("pendingRegistrationDetails");
    return raw ? { ...initialDetails, ...JSON.parse(raw) as RegistrationDetails } : initialDetails;
  } catch {
    return initialDetails;
  }
}

function validate(details: RegistrationDetails) {
  const errors: Partial<Record<keyof RegistrationDetails, string>> = {};
  if (details.firstName.trim().length < 1) errors.firstName = "Enter your first name.";
  if (details.lastName.trim().length < 1) errors.lastName = "Enter your last name.";
  if (details.phoneNumber.trim() && !/^[+0-9][0-9 ()-]{5,31}$/.test(details.phoneNumber.trim())) errors.phoneNumber = "Enter a valid phone number.";
  return errors;
}

export default function SignUpPage() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const [details, setDetails] = useState<RegistrationDetails>(savedDetails);
  const [touched, setTouched] = useState<Partial<Record<keyof RegistrationDetails, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validate(details), [details]);
  const isProfileCompletion = isSignedIn;

  const update = (field: keyof RegistrationDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setTouched({
      firstName: true,
      lastName: true,
      phoneNumber: true,
    });
    if (Object.keys(errors).length > 0) return;

    try {
      sessionStorage.setItem(
        "pendingRegistrationDetails",
        JSON.stringify({
          ...details,
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
           phoneNumber: details.phoneNumber.trim(),
        }),
      );
    } catch {
      // The auth step can still proceed when storage is unavailable.
    }
    setLocation(isSignedIn ? "/unlock" : "/sign-up/auth");
  };

  const fieldError = (field: keyof RegistrationDetails) =>
    (touched[field] || submitted) ? errors[field] : undefined;

  return (
    <div className="signup-page min-h-[100dvh] overflow-hidden bg-[#FBFCFA] px-4 py-4 text-[#14251F] sm:px-6 sm:py-6">
      <PageMeta
        title="Create your EcomStack account"
        description="Create your EcomStack account and explore prompts, skills and cheat sheets for ecommerce operators."
      />
      <div className="mx-auto max-w-[1080px]">
        <header className="flex h-14 items-center justify-between rounded-full border border-[#dfe7df] bg-white/90 px-4 shadow-[0_10px_35px_rgba(20,37,31,0.08)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight text-[#14251F]">
            <AppLogo className="h-7 w-7 shrink-0 rounded-lg" />
            EcomStack
          </Link>
          {!isProfileCompletion && <Link href="/sign-in" className="text-sm font-semibold text-[#52645d] transition-colors hover:text-[#193C36]">Sign in</Link>}
        </header>

        <main className="grid items-center gap-10 pb-8 pt-11 lg:grid-cols-[1fr_460px] lg:gap-16 lg:pt-16">
          <section className="signup-enter signup-intro hidden lg:block">
            <p className="text-xs font-bold tracking-[0.18em] text-[#2F765F]">ECOMSTACK RESOURCE VAULT</p>
            <h1 className="mt-5 max-w-md font-serif text-5xl leading-[0.98] tracking-[-0.05em] text-[#14251F]">Your next idea starts here.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#607069]">Prompts, skills and cheat sheets for building your ecommerce business and digital products.</p>
            <SignupResourceIllustration className="signup-float mt-7" />
          </section>

          <section className="signup-enter signup-form">
            <div className="mb-7">
              <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c]">
                <span className="text-[#193C36]">Account</span><span aria-hidden="true">→</span><span>Shopify</span><span aria-hidden="true">→</span><span>Vault</span>
              </div>
              <h2 className="font-serif text-4xl leading-[1.04] tracking-[-0.04em] text-[#14251F] sm:text-[2.7rem]">
                {isProfileCompletion ? "Finish setting up your account." : "Create your free account."}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#607069]">
                {isProfileCompletion ? "Add your details so we can finish setting up your member profile." : "Get your resources in one place."}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="first-name" className="mb-2 block text-[#31483f]">First name</Label>
                <Input id="first-name" autoComplete="given-name" value={details.firstName} onChange={(event) => update("firstName", event.target.value)} onBlur={() => setTouched((current) => ({ ...current, firstName: true }))} placeholder="First name" className={`h-12 rounded-xl border-[#d3ddd3] bg-white text-[#193c36] placeholder:text-[#9aa69e] focus-visible:ring-2 focus-visible:ring-[#2F765F] ${fieldError("firstName") ? "border-red-400" : ""}`} />
                {fieldError("firstName") && <p className="mt-1.5 text-xs text-red-600">{fieldError("firstName")}</p>}
              </div>
              <div>
                <Label htmlFor="last-name" className="mb-2 block text-[#31483f]">Last name</Label>
                <Input id="last-name" autoComplete="family-name" value={details.lastName} onChange={(event) => update("lastName", event.target.value)} onBlur={() => setTouched((current) => ({ ...current, lastName: true }))} placeholder="Last name" className={`h-12 rounded-xl border-[#d3ddd3] bg-white text-[#193c36] placeholder:text-[#9aa69e] focus-visible:ring-2 focus-visible:ring-[#2F765F] ${fieldError("lastName") ? "border-red-400" : ""}`} />
                {fieldError("lastName") && <p className="mt-1.5 text-xs text-red-600">{fieldError("lastName")}</p>}
              </div>
              </div>
              <div>
                <Label htmlFor="phone-number" className="mb-2 flex items-center gap-2 text-[#31483f]">Phone number <span className="text-xs font-normal text-[#6c7b72]">(optional)</span></Label>
                <Input id="phone-number" type="tel" inputMode="tel" autoComplete="tel" value={details.phoneNumber} onChange={(event) => update("phoneNumber", event.target.value)} onBlur={() => setTouched((current) => ({ ...current, phoneNumber: true }))} placeholder="+44 7700 900000" className={`h-12 rounded-xl border-[#d3ddd3] bg-white text-[#193c36] placeholder:text-[#9aa69e] focus-visible:ring-2 focus-visible:ring-[#2F765F] ${fieldError("phoneNumber") ? "border-red-400" : ""}`} />
                {fieldError("phoneNumber") && <p className="mt-1.5 text-xs text-red-600">{fieldError("phoneNumber")}</p>}
              </div>

              <div className="flex items-start gap-3 border-t border-[#dce4dc] pt-5 text-sm leading-6 text-[#6c7b72]">
                <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#193c36]" />
                <p>Your details stay with EcomStack and are used to set up your member profile.</p>
              </div>

              <Button type="submit" size="lg" className="signup-button h-13 w-full justify-between rounded-xl bg-[#193C36] px-5 text-white shadow-[0_12px_24px_rgba(25,60,54,0.16)] hover:bg-[#2F765F]">
                {isProfileCompletion ? "Continue to Shopify" : "Continue to verification"}
                <ArrowRight className="signup-arrow h-4 w-4" />
              </Button>
            </form>

            {!isProfileCompletion && <p className="mt-7 text-center text-sm text-[#6c7b72]">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-semibold text-[#193c36] underline decoration-[#b6cb7e] decoration-2 underline-offset-4 hover:text-[#24584e]">
                Sign in
              </Link>
            </p>}
          </section>
        </main>
      </div>
      <style>{`
        .signup-enter { animation: signup-rise .55s cubic-bezier(.22,.8,.26,1) both; } .signup-form { animation-delay: .1s; }
        .signup-float { animation: signup-float 6.5s ease-in-out infinite; } .signup-button:hover .signup-arrow { transform: translateX(4px); } .signup-arrow { transition: transform .2s ease; }
        .signup-button:focus-visible { outline: 3px solid #2F765F; outline-offset: 4px; }
        @keyframes signup-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes signup-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .signup-enter,.signup-float { animation:none !important; } .signup-button,.signup-arrow { transition:none !important; } }
      `}</style>
    </div>
  );
}