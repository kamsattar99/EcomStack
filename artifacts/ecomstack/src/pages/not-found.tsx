import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-6">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-serif font-medium mb-4 text-foreground">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        We couldn't find the page you were looking for. It might have been moved or deleted.
      </p>
      <div className="flex gap-4">
        <Button asChild className="rounded-full shadow-sm">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full bg-white">
          <Link href="/library">Browse Library</Link>
        </Button>
      </div>
    </div>
  );
}
