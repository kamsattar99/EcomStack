import { Check, MessageCircle, Sparkles } from "lucide-react";

export function SignupResourceIllustration({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-56 w-64 ${className}`}>
      <div className="absolute left-3 top-[4.5rem] h-20 w-20 rounded-[26px] border border-white/90 bg-[#2F765F] shadow-[inset_0_3px_5px_rgba(255,255,255,0.28),0_16px_24px_rgba(25,60,54,0.2)] [transform:rotate(-12deg)_rotateY(18deg)]" />
      <div className="absolute left-[4.6rem] top-5 grid h-24 w-24 place-items-center rounded-[30px] border border-white/80 bg-[#193C36] shadow-[inset_0_3px_5px_rgba(255,255,255,0.2),0_20px_30px_rgba(25,60,54,0.22)] [transform:rotate(7deg)_rotateY(-12deg)]">
        <MessageCircle className="h-10 w-10 text-[#E8F1E6]" strokeWidth={1.5} />
      </div>
      <div className="absolute left-[8.4rem] top-2 grid h-10 w-10 place-items-center rounded-xl border border-white bg-white shadow-[0_9px_18px_rgba(25,60,54,0.12)]">
        <Sparkles className="h-4 w-4 text-[#2F765F]" />
      </div>

      <div className="absolute bottom-4 right-1 h-[92px] w-[104px] rounded-2xl border border-white/90 bg-[#E8F1E6] shadow-[0_18px_24px_rgba(25,60,54,0.15)] [transform:rotate(9deg)_rotateY(-11deg)]" />
      <div className="absolute bottom-7 right-3 h-[92px] w-[104px] rounded-2xl border border-white/90 bg-white px-4 py-4 shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_20px_28px_rgba(25,60,54,0.13)] [transform:rotate(13deg)_rotateY(-11deg)]">
        <span className="mb-3 block h-1.5 w-10 rounded-full bg-[#193C36]/75" />
        <span className="mb-3 block h-1.5 w-14 rounded-full bg-[#2F765F]/35" />
        <span className="flex items-center gap-1 text-[#2F765F]"><Check className="h-3.5 w-3.5" /><i className="block h-1.5 w-7 rounded-full bg-[#2F765F]/40" /></span>
      </div>
    </div>
  );
}