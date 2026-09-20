import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetSite } from "@workspace/api-client-react";
import { ArrowRight, BookOpen, Search, Zap } from "lucide-react";
import { PageMeta } from "@/components/page-meta";

export default function LandingPage() {
  const { data: site } = useGetSite();

  return (
    <div className="flex flex-col flex-1 w-full">
      <PageMeta 
        title="Home" 
        description={site?.tagline || "Practical AI prompts, skills and cheat sheets for researching products, creating ads and building your store."}
      />
      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden flex-1 flex flex-col justify-center animate-in fade-in duration-1000 slide-in-from-bottom-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
        <div className="container mx-auto max-w-4xl text-center space-y-10">
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-foreground text-balance mx-auto">
            Your next ecommerce<br className="hidden md:inline" /> move starts here.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Practical AI prompts, skills and cheat sheets for researching products, creating ads and building your store.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button asChild size="lg" className="h-14 px-10 text-lg rounded-full w-full sm:w-auto shadow-sm">
              <Link href="/sign-up">
                Create your free account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Compact Explanation Section */}
      <section className="py-24 bg-card border-t border-border/60 mt-auto">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 text-center animate-in fade-in duration-1000 delay-300 slide-in-from-bottom-8 fill-mode-both">
            <div className="space-y-3 p-6 rounded-2xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/60 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-medium text-foreground">Curated Prompts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tested and refined prompts designed specifically for operators to accelerate workflows.
              </p>
            </div>
            
            <div className="space-y-3 p-6 rounded-2xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/60 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-medium text-foreground">Actionable Skills</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Step-by-step playbooks for researching competitors, structuring campaigns, and optimizing.
              </p>
            </div>
            
            <div className="space-y-3 p-6 rounded-2xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/60 hover:-translate-y-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-medium text-foreground">Cheat Sheets</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Downloadable references and frameworks you can share with your team.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} {site?.brandName || 'EcomStack'}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
