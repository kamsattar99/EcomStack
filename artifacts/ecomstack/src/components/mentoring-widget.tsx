import { ArrowUpRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const MENTORING_URL = "https://e-commercementoring.com/";

export function MentoringWidget() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#d7e2d6] bg-[#FBFCFA] p-5 shadow-[0_10px_20px_rgba(25,60,54,.05)]">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F1E6] text-[#193C36]">
        <GraduationCap aria-hidden="true" className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-bold tracking-[0.14em] text-[#2F765F]">ECOMMERCE MENTORING</p>
      <h2 className="mt-2 font-serif text-2xl leading-tight text-[#193C36]">Get personal support to grow your store.</h2>
      <p className="mt-3 text-sm leading-6 text-[#52675c]">Work with an ecommerce mentor on the strategy and next steps behind your ideas.</p>
      <Button asChild variant="outline" className="mt-5 w-full border-[#9ebba5] bg-white text-[#193C36] hover:bg-[#E8F1E6]">
        <a href={MENTORING_URL} target="_blank" rel="noopener noreferrer">
          Apply for mentoring <ArrowUpRight className="ml-2 h-4 w-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Button>
    </section>
  );
}