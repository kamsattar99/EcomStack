import { ExternalLink, FileText, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      videoId = parsed.searchParams.get("v") || "";
      if (!videoId) {
        const [segment] = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(segment)) {
          videoId = parsed.pathname.split("/").filter(Boolean)[1] || "";
        }
      }
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null;
  } catch {
    return null;
  }
}

interface TutorialVideoProps {
  url: string;
}

export function TutorialVideo({ url }: TutorialVideoProps) {
  const embedUrl = getYouTubeEmbedUrl(url);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#65776e]">Watch first</p>
          <h2 className="mt-1 font-serif text-2xl text-[#193C36]">Video tutorial</h2>
        </div>
        <Button asChild size="sm" variant="outline" className="border-[#cbdacb] bg-white text-[#193C36] hover:bg-[#E8F1E6]">
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open video</a>
        </Button>
      </div>
      {embedUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce7dd] bg-[#193C36] shadow-[0_10px_22px_rgba(25,60,54,.12)]">
          <iframe
            src={embedUrl}
            title="Video tutorial"
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="group mt-4 flex aspect-video items-center justify-center rounded-2xl bg-[#193C36] text-white shadow-[0_10px_22px_rgba(25,60,54,.12)]">
          <PlayCircle className="h-14 w-14 opacity-85 transition-transform group-hover:scale-110" />
          <span className="sr-only">Open video tutorial</span>
        </a>
      )}
    </section>
  );
}

interface LinkedResourceProps {
  url: string;
  resourceType?: string;
}

export function LinkedResource({ url, resourceType = "resource" }: LinkedResourceProps) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#65776e]">Use alongside the tutorial</p>
          <h2 className="mt-1 font-serif text-2xl text-[#193C36]">Resource link</h2>
        </div>
        <Button asChild size="sm" className="bg-[#193C36] text-white hover:bg-[#2F765F]">
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open {resourceType.toLowerCase()}</a>
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#dce7dd] bg-white shadow-[0_10px_22px_rgba(25,60,54,.05)]">
        <div className="flex items-center gap-3 border-b border-[#e4ece4] bg-[#FBFCFA] px-5 py-3 text-sm text-[#52675c]">
          <FileText className="h-4 w-4 shrink-0 text-[#2F765F]" />
          <span className="truncate">{url}</span>
        </div>
        <iframe
          src={url}
          title={`${resourceType} preview`}
          className="h-[520px] w-full bg-white"
          referrerPolicy="no-referrer"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#65776e]">If the preview is unavailable, the provider blocks embedding. Use “Open {resourceType.toLowerCase()}” to view it in a new tab.</p>
    </section>
  );
}