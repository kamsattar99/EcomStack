import { useState, useRef, useCallback } from "react";
import { Upload, X, File as FileIcon, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Asset, useRequestAssetUpload, useConfirmAsset, useDeleteAsset } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";

export interface LocalUpload {
  id: string; // Temporary ID for tracking
  name: string;
  size: number;
  contentType: string;
  progress: number;
  status: 'uploading' | 'validating' | 'ready' | 'failed';
  kind: 'file' | 'cover';
  assetId?: string;
  error?: string;
  file?: File;
}

interface Props {
  resourceId: string;
  assets: Asset[];
  uploads: LocalUpload[];
  setUploads: React.Dispatch<React.SetStateAction<LocalUpload[]>>;
  onAssetsChanged: () => void;
  onImportContent?: (content: string) => void;
}

export function AssetUploader({ resourceId, assets, uploads, setUploads, onAssetsChanged, onImportContent }: Props) {
  const { toast } = useToast();
  const requestAsset = useRequestAssetUpload();
  const confirmAsset = useConfirmAsset();
  const deleteAsset = useDeleteAsset();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingMdFile, setPendingMdFile] = useState<File | null>(null);
  const [pendingMdText, setPendingMdText] = useState<string>("");
  const [oldCoverToDelete, setOldCoverToDelete] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File, kind: 'file' | 'cover' = 'file') => {
    if (kind === 'cover') {
      const existingCover = assets.find(a => a.kind === 'cover');
      if (existingCover) {
        setOldCoverToDelete(existingCover.id);
      }
      uploadFile(file, kind);
    } else if (file.name.endsWith('.md') && onImportContent) {
      file.text().then(text => {
        setPendingMdText(text);
        setPendingMdFile(file);
      });
    } else {
      uploadFile(file, 'file');
    }
  };

  const handleMdImport = async () => {
    if (pendingMdText && onImportContent) {
      onImportContent(pendingMdText);
      setPendingMdFile(null);
      setPendingMdText("");
      toast({ title: "Imported markdown", description: "Content has been updated from the file." });
    }
  };

  const handleMdAttach = () => {
    if (pendingMdFile) {
      uploadFile(pendingMdFile, 'file');
      setPendingMdFile(null);
      setPendingMdText("");
    }
  };

  const uploadFile = async (file: File, kind: 'file' | 'cover' = 'file') => {
    if (file.size > 15 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 15 MiB." });
      return;
    }

    const tempId = Math.random().toString(36).substring(2, 9);
    
    setUploads(prev => [...prev, {
      id: tempId,
      name: file.name,
      size: file.size,
      contentType: file.type,
      progress: 0,
      status: 'uploading',
      kind,
      file
    }]);

    try {
      const reqRes = await requestAsset.mutateAsync({
        data: {
          resourceId,
          name: file.name,
          size: file.size,
          contentType: file.type,
          kind
        }
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", reqRes.uploadURL, true);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: percent } : u));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload rejected by storage"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

      setUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'validating' } : u));
      
      await confirmAsset.mutateAsync({ data: { assetId: reqRes.assetId } });
      
      setUploads(prev => prev.filter(u => u.id !== tempId));
      onAssetsChanged();
      toast({ title: "Upload complete", description: `${file.name} is ready.` });
    } catch (error: any) {
      setUploads(prev => prev.map(u => u.id === tempId ? { 
        ...u, 
        status: 'failed', 
        error: error.message || "Upload failed" 
      } : u));
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    }
  };

  const handleFiles = (files: File[]) => {
    Array.from(files).forEach(f => processFile(f));
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleDelete = async (assetId: string) => {
    try {
      await deleteAsset.mutateAsync({ id: assetId });
      onAssetsChanged();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to delete asset" });
    }
  };

  const retryUpload = (u: LocalUpload) => {
    setUploads(prev => prev.filter(x => x.id !== u.id));
    if (u.file) {
      uploadFile(u.file, u.kind);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">Cover Image</h4>
          <input 
            type="file" 
            accept="image/*"
            ref={coverInputRef}
            onChange={(e) => e.target.files && processFile(e.target.files[0], 'cover')}
            className="hidden" 
          />
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={() => coverInputRef.current?.click()}
            data-testid="button-upload-cover"
          >
            {assets.some(a => a.kind === 'cover') ? "Replace Cover" : "Upload Cover"}
          </Button>
        </div>
        {!assets.some(a => a.kind === 'cover') && !uploads.some(u => u.kind === 'cover') ? (
          <div className="p-4 border border-border border-dashed rounded-xl bg-muted/20 text-center">
            <p className="text-sm text-muted-foreground">No cover image uploaded. Type-specific fallback artwork will be used.</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-sm">Upload Files</h4>
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
          }`}
          data-testid="dropzone-assets"
        >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-1">Drag and drop files</h3>
        <p className="text-sm text-muted-foreground mb-6">Attach files, cheat sheets, or templates. 15 MiB limit.</p>
        
        <input 
          type="file" 
          multiple
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
          className="hidden" 
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-select-files"
        >
          Select Files
        </Button>
      </div>
      </div>

      {(assets.length > 0 || uploads.length > 0) && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Attached Assets</h4>
          <div className="space-y-2">
            {assets.map(a => (
              <div key={a.id} className="border border-border p-3 rounded-lg flex items-center justify-between bg-white" data-testid={`asset-${a.id}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden">
                    {a.kind === 'cover' || a.contentType.startsWith('image/') ? (
                      <img src={a.kind === 'cover' ? `/api/assets/${a.id}/cover` : `/api/assets/${a.id}/download?inline=1`} alt={a.name} className="h-full w-full object-cover" />
                    ) : (
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(a.size / 1024 / 1024).toFixed(2)} MB • {a.kind === 'cover' ? 'Cover Image' : 'Download'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <div className="flex items-center gap-1 text-primary text-xs mr-2 bg-primary/10 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </div>
                  <Button variant="ghost" size="icon" type="button" onClick={() => handleDelete(a.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`button-delete-${a.id}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {uploads.map(u => (
              <div key={u.id} className="border border-border p-3 rounded-lg flex flex-col gap-3 bg-white" data-testid={`upload-${u.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 bg-muted rounded-md shrink-0 flex items-center justify-center overflow-hidden">
                      {u.file && u.contentType.startsWith('image/') ? (
                        <img src={URL.createObjectURL(u.file)} alt={u.name} className="h-full w-full object-cover opacity-50" />
                      ) : (
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{(u.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2 text-xs font-medium">
                    {u.status === 'uploading' && <span className="text-muted-foreground">{u.progress}%</span>}
                    {u.status === 'validating' && <span className="flex items-center text-primary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Finalizing</span>}
                    {u.status === 'failed' && <span className="flex items-center text-destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</span>}
                  </div>
                </div>
                {u.status === 'uploading' && (
                  <Progress value={u.progress} className="h-1.5" />
                )}
                {u.status === 'failed' && (
                  <div className="flex justify-between items-center bg-destructive/10 px-3 py-2 rounded-md mt-2">
                    <span className="text-xs text-destructive">{u.error}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => retryUpload(u)} data-testid={`button-retry-${u.id}`}>Retry</Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))} data-testid={`button-remove-${u.id}`}>Remove</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingMdFile && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-serif mb-2">Import Markdown?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              You selected <strong>{pendingMdFile.name}</strong>. Import its text into the editor, or attach as a file?
            </p>
            <div className="flex-1 overflow-auto border border-border rounded-lg p-4 mb-4 bg-muted/30">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{pendingMdText}</ReactMarkdown>
              </div>
            </div>
            <div className="flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => { setPendingMdFile(null); setPendingMdText(""); }}>Cancel</Button>
              <Button variant="secondary" onClick={handleMdAttach} data-testid="button-md-attach">Attach as file</Button>
              <Button onClick={handleMdImport} data-testid="button-md-import">Import to content</Button>
            </div>
          </div>
        </div>
      )}

      {oldCoverToDelete && !uploads.some(u => u.kind === 'cover' && u.status === 'uploading') && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-serif mb-2">Remove old cover?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              You've successfully uploaded a new cover. Would you like to delete the old cover image?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOldCoverToDelete(null)}>Keep both</Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  await handleDelete(oldCoverToDelete);
                  setOldCoverToDelete(null);
                }}
              >
                Delete old cover
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
