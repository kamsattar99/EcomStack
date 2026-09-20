import { Loader2, CheckCircle2, AlertCircle, Circle } from "lucide-react";

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'failed';

export function EditorSaveStatus({ status }: { status: SaveStatus }) {
  if (status === 'idle') return <div className="w-32" />;
  
  return (
    <div className="flex items-center gap-2 text-sm font-medium w-32" data-testid={`save-status-${status}`}>
      {status === 'unsaved' && <><Circle className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Unsaved</span></>}
      {status === 'saving' && <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> <span className="text-muted-foreground">Saving...</span></>}
      {status === 'saved' && <><CheckCircle2 className="h-4 w-4 text-primary" /> <span className="text-primary">Draft saved</span></>}
      {status === 'failed' && <><AlertCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive">Save failed</span></>}
    </div>
  );
}
