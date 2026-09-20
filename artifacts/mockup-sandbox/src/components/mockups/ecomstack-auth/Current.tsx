import { ArrowLeft, Check, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import "./_group.css";

function ResourceIllustration() {
  return (
    <div aria-hidden="true" className="relative h-56 w-64">
      <div className="absolute left-3 top-[4.5rem] h-20 w-20 rounded-[26px] border border-white/90 bg-[#2F765F] shadow-[inset_0_3px_5px_rgba(255,255,255,0.28),0_16px_24px_rgba(25,60,54,0.2)] [transform:rotate(-12deg)_rotateY(18deg)]" />
      <div className="absolute left-[4.6rem] top-5 grid h-24 w-24 place-items-center rounded-[30px] border border-white/80 bg-[#193C36] shadow-[inset_0_3px_5px_rgba(255,255,255,0.2),0_20px_30px_rgba(25,60,54,0.22)] [transform:rotate(7deg)_rotateY(-12deg)]">
        <MessageCircle className="h-10 w-10 text-[#E8F1E6]" strokeWidth={1.5} />
      </div>
      <div className="absolute left-[8.4rem] top-2 grid h-10 w-10 place-items-center rounded-xl border border-white bg-white shadow-[0_9px_18px_rgba(25,60,54,0.12)]"><Sparkles className="h-4 w-4 text-[#2F765F]" /></div>
      <div className="absolute bottom-4 right-1 h-[92px] w-[104px] rounded-2xl border border-white/90 bg-[#E8F1E6] shadow-[0_18px_24px_rgba(25,60,54,0.15)] [transform:rotate(9deg)_rotateY(-11deg)]" />
      <div className="absolute bottom-7 right-3 h-[92px] w-[104px] rounded-2xl border border-white/90 bg-white px-4 py-4 shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_20px_28px_rgba(25,60,54,0.13)] [transform:rotate(13deg)_rotateY(-11deg)]">
        <span className="mb-3 block h-1.5 w-10 rounded-full bg-[#193C36]/75" />
        <span className="mb-3 block h-1.5 w-14 rounded-full bg-[#2F765F]/35" />
        <span className="flex items-center gap-1 text-[#2F765F]"><Check className="h-3.5 w-3.5" /><i className="block h-1.5 w-7 rounded-full bg-[#2F765F]/40" /></span>
      </div>
    </div>
  );
}

export function Current() {
  return (
    <div className="ecomstack-auth-mockup overflow-hidden px-6 py-6">
      <div className="mx-auto w-full max-w-[1080px]">
        <header className="flex h-14 items-center justify-between rounded-full border border-[#dfe7df] bg-white/90 px-5 shadow-[0_10px_35px_rgba(20,37,31,0.08)]">
          <span className="font-serif text-lg font-bold">EcomStack</span>
          <span className="inline-flex items-center gap-2 text-sm text-[#65756d]"><ArrowLeft className="h-4 w-4" /> Edit details</span>
        </header>
        <main className="grid items-center gap-16 pt-16 lg:grid-cols-[1fr_460px]">
          <section>
            <p className="text-xs font-bold tracking-[0.18em] text-[#2F765F]">ALMOST THERE</p>
            <h1 className="mt-5 max-w-md text-5xl leading-[0.98] tracking-[-0.05em]">Your resources are waiting.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#607069]">Confirm your email, then you can explore EcomStack and put the resources to work.</p>
            <ResourceIllustration />
          </section>
          <section>
            <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#74857c]"><span className="text-[#193C36]">Account</span> → <span>Shopify</span> → <span>Vault</span></div>
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#E8F1E6] text-[#193C36]"><ShieldCheck className="h-6 w-6" /></div>
            <h2 className="text-4xl leading-[1.05] tracking-[-0.04em]">One quick check, then you are in.</h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-[#607069]">Confirm your email to keep your account secure. Your details are saved while you complete this step.</p>
            <div className="mt-6 rounded-3xl border border-[#dfe7df] bg-white p-8 shadow-[0_18px_50px_rgba(25,60,54,0.10)]">
              <p className="text-center font-semibold">Create your account</p>
              <p className="mt-1 text-center text-sm text-[#607069]">Get started today</p>
              <div className="mt-7 grid grid-cols-2 gap-3"><button className="h-12 rounded-xl border border-[#d3ddd3]">Apple</button><button className="h-12 rounded-xl border border-[#d3ddd3]">Google</button></div>
              <p className="my-5 text-center text-xs text-[#74857c]">or</p>
              <label className="block text-sm font-medium">Email address<input placeholder="Enter your email address" className="mt-2 h-12 w-full rounded-xl border border-[#d3ddd3] px-3 text-sm" /></label>
              <label className="mt-4 block text-sm font-medium">Password<input placeholder="Create a password" type="password" className="mt-2 h-12 w-full rounded-xl border border-[#d3ddd3] px-3 text-sm" /></label>
              <button className="mt-6 h-12 w-full rounded-xl bg-[#193C36] text-white">Continue →</button>
              <p className="mt-5 text-center text-xs text-[#607069]">Already have an account? <b>Sign in</b></p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}