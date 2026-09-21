"use client";

import { useState } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ShareResourceButtonProps = {
  slug: string;
  title: string;
  description?: string;
  iconOnly?: boolean;
  className?: string;
};

export function ShareResourceButton({ slug, title, description, iconOnly = false, className }: ShareResourceButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = new URL(`/resources/${slug}`, window.location.origin).toString();

    try {
      if (navigator.share) {
        await navigator.share({ title, text: description, url });
        return;
      }

      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ title: "Share link copied", description: "The direct resource link is ready to share." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ variant: "destructive", title: "Couldn’t share this resource", description: "Please copy the page address and try again." });
    }
  };

  const label = copied ? "Link copied" : "Share";

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleShare}
      aria-label={`Share ${title}`}
      className={className}
    >
      {copied ? <Check className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} /> : iconOnly ? <Share2 className="h-4 w-4" /> : <LinkIcon className="mr-2 h-4 w-4" />}
      {!iconOnly && label}
    </Button>
  );
}