import { useState } from "react";
import { Link } from "wouter";
import { useListResources } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Lock, Unlock, FileText, Wrench, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { PageMeta } from "@/components/page-meta";

function useQueryParams() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams;
}

export default function LibraryPage() {
  const searchParams = useQueryParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [tool, setTool] = useState(searchParams.get("tool") || "");
  const [sort, setSort] = useState("newest");
  const [, setLocation] = useLocation();

  const { data: library, isLoading } = useListResources({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    type: type !== "all" ? type : undefined,
    tool: tool !== "all" ? tool : undefined,
    sort
  });

  const categories = library?.taxonomies?.filter(t => t.kind === 'category') || [];
  const tools = library?.taxonomies?.filter(t => t.kind === 'tool') || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "all") params.set("category", category);
    if (type && type !== "all") params.set("type", type);
    if (tool && tool !== "all") params.set("tool", tool);
    setLocation(`/library?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <PageMeta title="Vault" description="Browse EcomStack prompts, skills, and cheat sheets for ecommerce operators." />
      <div className="mb-12 text-center md:text-left space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground tracking-tight">Vault</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">Browse our collection of prompts, skills, and cheat sheets designed to level up your ecommerce operations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center">
                <FileText className="h-4 w-4 mr-2" /> Format
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="Prompt">Prompt</SelectItem>
                  <SelectItem value="Skill">Skill</SelectItem>
                  <SelectItem value="Cheat Sheet">Cheat Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center">
                <Hash className="h-4 w-4 mr-2" /> Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center">
                <Wrench className="h-4 w-4 mr-2" /> Tool
              </label>
              <Select value={tool} onValueChange={setTool}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Tools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {tools.map(t => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">Apply Filters</Button>
          </form>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">
              {isLoading ? "Loading..." : `${library?.total || 0} Resources`}
            </h2>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : library?.resources && library.resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.resources.map((resource) => (
                <Link key={resource.id} href={`/resources/${resource.slug}`}>
                  <div className="group flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all hover:border-primary/30 active-elevate-2 cursor-pointer">
                    <div className="aspect-[16/9] relative bg-secondary overflow-hidden">
                      {resource.coverUrl ? (
                         <img src={resource.coverUrl} alt={resource.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FileText className="h-10 w-10 opacity-20" />
                        </div>
                      )}
                      
                      {resource.isDemo && (
                         <div className="absolute top-3 right-3">
                           <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 shadow-sm">Demo</Badge>
                         </div>
                      )}
                      {!resource.isFree && !resource.isDemo && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-background/90 backdrop-blur text-foreground rounded-full p-1.5 shadow-sm">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="bg-background text-xs font-medium">
                          {resource.type}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-medium">
                          {resource.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-serif font-medium leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {resource.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                        {resource.description}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Wrench className="h-3 w-3 mr-1" />
                          {resource.tool}
                        </span>
                        <span>{resource.version}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-xl border border-border">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
              <Button onClick={() => {
                setSearch(""); setCategory("all"); setType("all"); setTool("all");
                setLocation("/library");
              }} variant="outline">Clear Filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
