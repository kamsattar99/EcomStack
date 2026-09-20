import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetSite } from "@workspace/api-client-react";
import { ArrowRight, Check, MessageCircle, Sparkles, Youtube } from "lucide-react";
import { PageMeta } from "@/components/page-meta";

type ResourceKind = "prompts" | "skills" | "cheats";

function DimensionalIcon({ kind, className = "" }: { kind: ResourceKind; className?: string }) {
  if (kind === "prompts") {
    return (
      <div aria-hidden="true" className={`relative h-32 w-32 ${className}`}>
        <div className="absolute left-7 top-5 h-20 w-20 rounded-[26px] border border-white/80 bg-[#E8F1E6] shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),0_18px_24px_rgba(25,60,54,0.17)] [transform:rotate(-8deg)_rotateY(-12deg)]" />
        <div className="absolute left-9 top-7 grid h-20 w-20 place-items-center rounded-[24px] bg-[#193C36] shadow-[inset_0_2px_3px_rgba(255,255,255,0.18),0_12px_18px_rgba(25,60,54,0.22)] [transform:rotate(5deg)_rotateY(16deg)]">
          <MessageCircle className="h-8 w-8 text-[#E8F1E6]" strokeWidth={1.6} />
        </div>
        <div className="absolute right-2 top-1 grid h-9 w-9 place-items-center rounded-xl bg-white shadow-[0_8px_16px_rgba(25,60,54,0.14)]">
          <Sparkles className="h-4 w-4 text-[#2F765F]" />
        </div>
      </div>
    );
  }

  if (kind === "skills") {
    return (
      <div aria-hidden="true" className={`relative h-32 w-32 ${className}`}>
        <div className="absolute left-3 top-10 h-14 w-14 rounded-2xl border border-white/90 bg-[#2F765F] shadow-[inset_0_3px_5px_rgba(255,255,255,0.3),0_16px_22px_rgba(25,60,54,0.18)] [transform:rotate(-12deg)_rotateY(22deg)]" />
        <div className="absolute right-4 top-4 h-16 w-16 rounded-[22px] border border-white/90 bg-[#E8F1E6] shadow-[inset_0_3px_5px_rgba(255,255,255,0.85),0_16px_22px_rgba(25,60,54,0.13)] [transform:rotate(10deg)_rotateY(-18deg)]" />
        <div className="absolute bottom-4 left-11 h-14 w-14 rounded-2xl bg-[#193C36] shadow-[inset_0_3px_5px_rgba(255,255,255,0.18),0_15px_20px_rgba(25,60,54,0.22)] [transform:rotate(3deg)_rotateY(14deg)]" />
        <div className="absolute bottom-9 left-[3.55rem] h-5 w-5 rounded-md border border-white/50 bg-[#E8F1E6]" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={`relative h-32 w-32 ${className}`}>
      <div className="absolute left-5 top-8 h-[72px] w-[76px] rounded-2xl border border-white bg-[#2F765F]/40 shadow-[0_14px_20px_rgba(25,60,54,0.12)] [transform:rotate(-12deg)]" />
      <div className="absolute left-8 top-5 h-[74px] w-[76px] rounded-2xl border border-white bg-[#E8F1E6] shadow-[0_16px_22px_rgba(25,60,54,0.16)] [transform:rotate(5deg)]" />
      <div className="absolute left-10 top-7 h-[74px] w-[76px] rounded-2xl border border-white/90 bg-white px-4 py-4 shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_18px_22px_rgba(25,60,54,0.14)] [transform:rotate(11deg)_rotateY(-10deg)]">
        <span className="mb-2 block h-1.5 w-8 rounded-full bg-[#193C36]/80" />
        <span className="mb-2 block h-1.5 w-11 rounded-full bg-[#2F765F]/45" />
        <span className="flex items-center gap-1 text-[#2F765F]"><Check className="h-3 w-3" /><i className="block h-1.5 w-6 rounded-full bg-[#2F765F]/45" /></span>
      </div>
    </div>
  );
}

const resources: Array<{ kind: ResourceKind; title: string; description: string }> = [
  { kind: "prompts", title: "Prompts", description: "Clear starting points for product research, ad ideas, content and digital offers." },
  { kind: "skills", title: "Skills", description: "Practical workflows for turning ideas into repeatable work." },
  { kind: "cheats", title: "Cheat sheets", description: "Quick references, checklists and frameworks to keep beside you." },
];

export default function LandingPage() {
  const { data: site } = useGetSite();

  return (
    <div className="landing-page flex w-full flex-1 flex-col overflow-hidden bg-[#FBFCFA] text-[#14251F]">
      <PageMeta 
        title="EcomStack | Resources for your next big idea"
        description={site?.tagline || "Practical prompts, skills and cheat sheets for ecommerce and digital product creators."}
      />
      <section className="landing-hero relative isolate px-4 pb-16 pt-10 sm:pt-14 md:pb-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 landing-grid" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-16 -z-10 h-80 w-80 rounded-full bg-[#E8F1E6]/80 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-6 -z-10 h-96 w-96 rounded-full bg-[#dceee5]/70 blur-3xl" />

        <div className="relative mx-auto max-w-[1240px]">
          <DimensionalIcon kind="prompts" className="landing-float-one pointer-events-none !absolute left-0 top-[19%] hidden scale-90 lg:block xl:scale-100" />
          <DimensionalIcon kind="cheats" className="landing-float-two pointer-events-none !absolute bottom-[5%] left-[9%] hidden scale-75 lg:block xl:scale-90" />
          <DimensionalIcon kind="skills" className="landing-float-three pointer-events-none !absolute right-0 top-[15%] hidden scale-90 lg:block xl:scale-100" />
          <DimensionalIcon kind="prompts" className="landing-float-four pointer-events-none !absolute bottom-[8%] right-[9%] hidden scale-75 lg:block xl:scale-90" />

          <div className="mx-auto max-w-[800px] text-center">
            <div className="landing-enter landing-enter-1 flex flex-wrap items-center justify-center gap-2 text-sm text-[#456056]">
              <span className="mr-1 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7d74]">Built by</span>
              <a href="https://www.youtube.com/@THEECOMKING" target="_blank" rel="noopener noreferrer" aria-label="Visit The Ecom King on YouTube" className="creator-profile">
                <img src="https://yt3.googleusercontent.com/rNSQYz_JJUsDMsa_MW2fXUYyVVJP27aOPiQqyn3prdHDCtwyUdxR2EeyPUQ3GLR58hQFY1stbA=s160-c-k-c0x00ffffff-no-rj" alt="The Ecom King YouTube channel avatar" className="h-9 w-9 rounded-full object-cover" />
                <span>The Ecom King</span><Youtube aria-hidden="true" className="h-3.5 w-3.5 text-[#2F765F]" />
              </a>
              <span aria-hidden="true" className="font-serif text-base text-[#789087]">&amp;</span>
              <a href="https://www.youtube.com/channel/UCekIx7k0LtWGyovlIgC_2Kg" target="_blank" rel="noopener noreferrer" aria-label="Visit Kamil Sattar Make Money With AI on YouTube" className="creator-profile">
                <img src="https://yt3.googleusercontent.com/kiqUOuI8Z2s4Fu_OUfGJKGwKTuzbA7b2moQHDVqSErfMgQ5MvsekZ3B33yZOZDSZWjdusi60iII=s160-c-k-c0x00ffffff-no-rj" alt="Kamil Sattar Make Money With AI YouTube channel avatar" className="h-9 w-9 rounded-full object-cover" />
                <span>Kamil Sattar | Make Money With AI</span><Youtube aria-hidden="true" className="h-3.5 w-3.5 text-[#2F765F]" />
              </a>
            </div>
            <p className="landing-enter landing-enter-2 mt-5 inline-flex rounded-full border border-[#cdddcf] bg-white/80 px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-[#2F765F] shadow-sm">
              FOR ECOMMERCE &amp; DIGITAL PRODUCT CREATORS
            </p>
            <h1 className="landing-enter landing-enter-3 mx-auto mt-5 max-w-[780px] text-balance font-serif text-[2.5rem] font-medium leading-[0.98] tracking-[-0.05em] text-[#14251F] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.5rem] xl:text-[5rem]">
              <span className="text-[#2F765F]">Prompts, skills</span> &amp; cheat sheets.<br />
              Built for your next big idea.
            </h1>
            <p className="landing-enter landing-enter-4 mx-auto mt-5 max-w-2xl text-base leading-7 text-[#5f7169] sm:text-lg">
              Practical resources to research products, create content, improve your store and launch digital offers—all in one place.
            </p>
            <div className="landing-enter landing-enter-5 mt-7 flex flex-col items-center">
              <Button asChild size="lg" className="landing-cta h-14 rounded-full bg-[#193C36] px-8 text-base text-white shadow-[0_12px_24px_rgba(25,60,54,0.18)] hover:bg-[#2F765F] sm:px-10">
                <Link href="/sign-up">
                  Create free account <ArrowRight className="landing-arrow ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-[#6b7d74]">Your next useful resource starts here.</p>
            </div>
            <div aria-hidden="true" className="mt-4 flex items-center justify-between px-1 lg:hidden">
              <DimensionalIcon kind="cheats" className="landing-float-two origin-left scale-[.58]" />
              <DimensionalIcon kind="prompts" className="landing-float-four origin-right scale-[.58]" />
            </div>
          </div>
        </div>
      </section>

      <section id="whats-inside" className="border-y border-[#e1e9e1] bg-white/70 px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.18em] text-[#2F765F]">WHAT&apos;S INSIDE</p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.04] tracking-[-0.04em] text-[#14251F] sm:text-5xl">Find the right resource. Get to work.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {resources.map((resource, index) => (
              <article key={resource.kind} className={`landing-card landing-card-${index + 1} group relative overflow-hidden rounded-3xl border border-[#dce7dd] bg-[#FBFCFA] p-7 shadow-[0_12px_28px_rgba(25,60,54,0.06)]`}>
                <DimensionalIcon kind={resource.kind} className="transition-transform duration-500 group-hover:[transform:rotateX(5deg)_rotateY(-7deg)_translateY(-5px)]" />
                <h3 className="mt-4 font-serif text-2xl font-medium tracking-[-0.03em] text-[#193C36]">{resource.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[#62736b]">{resource.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#FBFCFA] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-[#718078] sm:flex-row">
          <p>© {new Date().getFullYear()} {site?.brandName || "EcomStack"}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/support" className="transition-colors hover:text-[#193C36]">Support</Link>
            <Link href="/sign-in" className="transition-colors hover:text-[#193C36]">Sign in</Link>
          </div>
        </div>
      </footer>
      <style>{`
        .landing-grid { background-image: linear-gradient(rgba(47, 118, 95, .055) 1px, transparent 1px), linear-gradient(90deg, rgba(47, 118, 95, .055) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(to bottom, black, transparent 92%); }
        .landing-enter { animation: landing-rise .65s cubic-bezier(.22, .8, .26, 1) both; }
        .landing-enter-2 { animation-delay: .07s; } .landing-enter-3 { animation-delay: .14s; } .landing-enter-4 { animation-delay: .21s; } .landing-enter-5 { animation-delay: .28s; }
        .creator-profile { display:inline-flex; max-width:100%; align-items:center; gap:.45rem; border:1px solid #d9e5da; border-radius:999px; background:rgba(255,255,255,.74); padding:.25rem .6rem .25rem .28rem; font-size:.75rem; font-weight:600; line-height:1.2; color:#193C36; transition:border-color .2s ease, background .2s ease; }
        .creator-profile:hover { border-color:#8eb4a0; background:#fff; } .creator-profile:focus-visible { outline:3px solid #2F765F; outline-offset:3px; }
        .landing-float-one { animation: landing-float 6s ease-in-out infinite; } .landing-float-two { animation: landing-float 7.5s ease-in-out -.8s infinite; } .landing-float-three { animation: landing-float 6.8s ease-in-out -2s infinite; } .landing-float-four { animation: landing-float 7.1s ease-in-out -1.6s infinite; }
        .landing-card { animation: landing-rise .65s cubic-bezier(.22, .8, .26, 1) both; transition: transform .3s ease, box-shadow .3s ease; }
        .landing-card-1 { animation-delay: .12s; } .landing-card-2 { animation-delay: .2s; } .landing-card-3 { animation-delay: .28s; }
        .landing-card:hover { transform: translateY(-6px); box-shadow: 0 20px 36px rgba(25,60,54,.12); }
        .landing-cta:focus-visible { outline: 3px solid #2F765F; outline-offset: 4px; } .landing-cta:hover .landing-arrow { transform: translateX(4px); } .landing-arrow { transition: transform .2s ease; }
        @keyframes landing-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes landing-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @media (prefers-reduced-motion: reduce) { .landing-enter, .landing-card, .landing-float-one, .landing-float-two, .landing-float-three, .landing-float-four { animation: none !important; } .landing-card, .landing-cta, .landing-arrow, .creator-profile { transition: none !important; } }
      `}</style>
    </div>
  );
}
