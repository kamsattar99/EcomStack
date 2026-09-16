import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetSite } from "@workspace/api-client-react";
import { ArrowRight, BookOpen, Search, Zap, CheckCircle2, Shield } from "lucide-react";
import { PageMeta } from "@/components/page-meta";

export default function LandingPage() {
  const { data: site } = useGetSite();

  return (
    <div className="flex flex-col min-h-screen">
      <PageMeta 
        title="Home" 
        description={site?.tagline || "AI skills, prompts and playbooks for ecommerce."} 
      />
      {/* Hero Section */}
      <section className="relative px-4 pt-24 pb-32 md:pt-36 md:pb-48 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4 transition-colors hover:bg-primary/10">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            {site?.offerTitle || "Curated intelligence for operators"}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-foreground text-balance">
            Your next ecommerce<br className="hidden md:inline" /> launch starts here.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI skills, prompts and playbooks for ecommerce.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto pb-4">
            Explore practical AI prompts, downloadable skills and cheat sheets for researching products, creating ads and running your store.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-base rounded-full w-full sm:w-auto shadow-sm">
              <Link href="/library">
                Explore the vault <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base rounded-full w-full sm:w-auto">
              <Link href="/unlock">How to unlock</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto md:mx-0">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium">Curated Prompts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tested and refined prompts designed specifically for ecommerce operators to accelerate daily workflows.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto md:mx-0">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium">Actionable Skills</h3>
              <p className="text-muted-foreground leading-relaxed">
                Step-by-step playbooks for researching competitors, structuring campaigns, and optimizing conversions.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto md:mx-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif font-medium">Cheat Sheets</h3>
              <p className="text-muted-foreground leading-relaxed">
                Downloadable references and frameworks you can share with your team to standardize best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / How it works */}
      <section className="py-32">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
                Get full access to the vault
              </h2>
              <p className="text-lg text-muted-foreground">
                Our library is protected to maintain quality and exclusivity for serious operators. You can unlock lifetime access by starting a new trial with our partners.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Complete access to all current resources",
                  "Free updates as we add new playbooks",
                  "Direct support for implementation",
                  "Downloadable assets and templates"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-primary mr-3 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-6">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/unlock">View eligibility requirements</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-secondary border border-border p-8 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:20px_20px]"></div>
                
                <div className="relative z-10 space-y-4">
                  <Shield className="h-10 w-10 text-primary" />
                  <h3 className="text-2xl font-serif font-medium">Protected Assets</h3>
                </div>
                
                <div className="relative z-10 bg-card rounded-xl p-6 shadow-sm border border-border mt-auto translate-y-4 group-hover:translate-y-0 transition-transform">
                  <div className="h-4 w-1/3 bg-muted rounded mb-4"></div>
                  <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-muted rounded"></div>
                  <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                    <div className="h-8 w-24 bg-primary/10 rounded-full"></div>
                    <div className="h-8 w-8 rounded-full bg-secondary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} {site?.brandName || 'EcomStack'}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            <Link href="/library" className="hover:text-foreground transition-colors">Library</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
