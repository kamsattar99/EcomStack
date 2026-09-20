import { Mail, ShieldCheck, Sparkles } from "lucide-react";

export function AuthIllustration({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-52 w-56 ${className}`}>
      <div className="absolute left-2 top-[4.5rem] h-20 w-20 rounded-[26px] border border-white/90 bg-[#2F765F] shadow-[inset_0_3px_5px_rgba(255,255,255,0.28),0_16px_24px_rgba(25,60,54,0.2)] [transform:rotate(-13deg)_rotateY(18deg)]" />
      <div className="absolute left-[3.5rem] top-6 grid h-28 w-28 place-items-center rounded-[32px] border border-white/80 bg-[#E8F1E6] shadow-[inset_0_3px_5px_rgba(255,255,255,0.88),0_20px_30px_rgba(25,60,54,0.18)] [transform:rotate(7deg)_rotateY(-12deg)]">
        <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#193C36] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
          <ShieldCheck className="h-8 w-8 text-[#E8F1E6]" strokeWidth={1.5} />
        </div>
      </div>
      <div className="absolute right-1 top-4 grid h-10 w-10 place-items-center rounded-xl border border-white bg-white shadow-[0_9px_18px_rgba(25,60,54,0.12)]">
        <Sparkles className="h-4 w-4 text-[#2F765F]" />
      </div>
      <div className="absolute bottom-2 right-2 grid h-16 w-20 place-items-center rounded-2xl border border-white/90 bg-white shadow-[0_16px_24px_rgba(25,60,54,0.14)] [transform:rotate(10deg)_rotateY(-12deg)]">
        <Mail className="h-7 w-7 text-[#2F765F]" strokeWidth={1.5} />
      </div>
    </div>
  );
}