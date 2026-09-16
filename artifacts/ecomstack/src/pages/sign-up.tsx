import { ArrowRight, Check, LockKeyhole, Phone, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMeta } from "@/components/page-meta";

type RegistrationDetails = {
  fullName: string;
  countryCode: string;
  phone: string;
};

const initialDetails: RegistrationDetails = {
  fullName: "",
  countryCode: "+1",
  phone: "",
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
  if (details.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!/^\+\d{1,4}$/.test(details.countryCode.trim())) {
    errors.countryCode = "Use a country code such as +1 or +44.";
  }
  const phoneDigits = details.phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = "Enter a phone number with 7 to 15 digits.";
  }
  return errors;
}

export default function SignUpPage() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const [details, setDetails] = useState<RegistrationDetails>(savedDetails);
  const [touched, setTouched] = useState<Partial<Record<keyof RegistrationDetails, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validate(details), [details]);

  const update = (field: keyof RegistrationDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setTouched({
      fullName: true,
      countryCode: true,
      phone: true,
    });
    if (Object.keys(errors).length > 0) return;

    try {
      sessionStorage.setItem(
        "pendingRegistrationDetails",
        JSON.stringify({
          ...details,
          fullName: details.fullName.trim(),
          countryCode: details.countryCode.trim(),
          phone: details.phone.replace(/\D/g, ""),
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
    <div className="min-h-[100dvh] bg-[#f4f6f1] text-[#17231f]">
      <PageMeta
        title="Create your EcomStack account"
        description="Create your EcomStack account and explore prompts, skills and cheat sheets for ecommerce operators."
      />
      <div className="mx-auto grid min-h-[100dvh] max-w-[1440px] lg:grid-cols-[minmax(360px,0.82fr)_minmax(520px,1.18fr)]">
        <aside className="relative hidden overflow-hidden bg-[#193c36] px-12 py-12 text-[#f3f1e7] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 top-24 h-72 w-72 rounded-full border border-[#d7ef9b]/20" />
          <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-[#d7ef9b]/15" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.16em]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d7ef9b] text-[#193c36]">E</span>
              ECOMSTACK
            </Link>
            <div className="mt-28 max-w-sm">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#d7ef9b]">The operator's vault</p>
              <h1 className="font-serif text-5xl leading-[0.98] tracking-[-0.04em]">
                Less searching. More shipping.
              </h1>
              <p className="mt-7 max-w-xs text-base leading-7 text-[#dce7dd]/75">
                Practical resources for the moments your store needs a next move, not another opinion.
              </p>
            </div>
          </div>
          <div className="relative space-y-4 text-sm text-[#dce7dd]/80">
            {["Prompts for repeatable work", "Skills for the messy middle", "Cheat sheets you can use today"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-[#d7ef9b]/50 text-[#d7ef9b]">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex items-center px-5 py-8 sm:px-10 lg:px-20 lg:py-14">
          <div className="mx-auto w-full max-w-[590px]">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-[#193c36]">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#193c36] text-[#d7ef9b]">E</span>
                ECOMSTACK
              </Link>
              <Link href="/sign-in" className="text-sm font-medium text-[#53645d] hover:text-[#193c36]">
                Sign in
              </Link>
            </div>

            <div className="mb-10">
              <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6c7b72]">
                <span className="text-[#193c36]">1. Your details</span>
                <span aria-hidden="true">→</span>
                <span>2. Start Shopify</span>
                <span aria-hidden="true">→</span>
                <span>3. Open the vault</span>
              </div>
              <h2 className="font-serif text-4xl leading-[1.06] tracking-[-0.04em] text-[#193c36] sm:text-5xl">
                Create your EcomStack account.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#607069]">
                Create your EcomStack account, get started with Shopify, and explore your ecommerce prompts, skills and cheat sheets.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <Label htmlFor="full-name" className="mb-2 block text-[#31483f]">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#829089]" />
                  <Input
                    id="full-name"
                    autoComplete="name"
                    value={details.fullName}
                    onChange={(event) => update("fullName", event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
                    placeholder="Your name"
                    className={`h-11 border-[#d3ddd3] bg-[#fbfcf8] pl-10 text-[#193c36] placeholder:text-[#9aa69e] focus-visible:ring-[#193c36] ${fieldError("fullName") ? "border-red-400" : ""}`}
                  />
                </div>
                {fieldError("fullName") && <p className="mt-1.5 text-xs text-red-600">{fieldError("fullName")}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="mb-2 block text-[#31483f]">Phone number</Label>
                <div className="flex gap-2">
                  <select
                    id="country-code"
                    aria-label="Country code"
                    value={details.countryCode}
                    onChange={(event) => update("countryCode", event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, countryCode: true }))}
                    className={`h-11 w-[104px] rounded-md border border-[#d3ddd3] bg-[#fbfcf8] px-2 text-sm text-[#193c36] outline-none focus:ring-2 focus:ring-[#193c36] ${fieldError("countryCode") ? "border-red-400" : ""}`}
                  >
                    <option value="+1">US/CA +1</option>
                    <option value="+44">UK +44</option>
                    <option value="+61">AU +61</option>
                    <option value="+64">NZ +64</option>
                    <option value="+27">ZA +27</option>
                    <option value="+353">IE +353</option>
                    <option value="+33">FR +33</option>
                    <option value="+49">DE +49</option>
                    <option value="+31">NL +31</option>
                    <option value="+971">UAE +971</option>
                    <option value="+966">SA +966</option>
                    <option value="+91">IN +91</option>
                    <option value="+92">PK +92</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#829089]" />
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      value={details.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
                      placeholder="555 014 2088"
                      className={`h-11 border-[#d3ddd3] bg-[#fbfcf8] pl-10 text-[#193c36] placeholder:text-[#9aa69e] focus-visible:ring-[#193c36] ${fieldError("phone") ? "border-red-400" : ""}`}
                    />
                  </div>
                </div>
                {(fieldError("countryCode") || fieldError("phone")) && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldError("countryCode") || fieldError("phone")}</p>
                )}
              </div>

              <div className="flex items-start gap-3 border-t border-[#dce4dc] pt-5 text-sm leading-6 text-[#6c7b72]">
                <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#193c36]" />
                <p>Your details stay with EcomStack and are used to set up your member profile.</p>
              </div>

              <Button type="submit" size="lg" className="h-12 w-full justify-between rounded-xl bg-[#193c36] px-5 text-[#f4f6f1] hover:bg-[#24584e]">
                {isSignedIn ? "Save details" : "Continue to verification"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-[#6c7b72]">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-semibold text-[#193c36] underline decoration-[#b6cb7e] decoration-2 underline-offset-4 hover:text-[#24584e]">
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}