import { useListSupportRequests, useUpdateSupportRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSupportRequestsQueryKey } from "@workspace/api-client-react";

export default function AdminSupportPage() {
  const { data: requests, isLoading } = useListSupportRequests();
  const updateSupport = useUpdateSupportRequest();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleResolve = (id: string) => {
    updateSupport.mutate({ id, data: { status: 'resolved' } }, {
      onSuccess: () => {
        toast({ title: "Request marked as resolved" });
        queryClient.invalidateQueries({ queryKey: getListSupportRequestsQueryKey() });
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading requests...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium">Support Requests</h1>
        <p className="text-muted-foreground mt-1">Manage incoming user inquiries and issues.</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.map(req => (
              <TableRow key={req.id} className={req.status === 'resolved' ? 'opacity-60' : ''}>
                <TableCell>
                  <Badge variant={req.status === 'open' ? 'destructive' : 'secondary'} className="capitalize">
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{req.subject}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{req.userId.substring(0,8)}...</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(req.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm"><MessageSquare className="h-3 w-3 mr-1" /> View</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{req.subject}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="text-sm font-medium mb-1 text-muted-foreground">From User ID: <span className="font-mono">{req.userId}</span></div>
                        <div className="text-sm font-medium mb-4 text-muted-foreground">Date: {new Date(req.createdAt).toLocaleString()}</div>
                        <div className="bg-secondary/50 p-4 rounded-md whitespace-pre-wrap text-sm border border-border">
                          {req.message}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {req.status === 'open' && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleResolve(req.id)}
                      disabled={updateSupport.isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {requests?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No support requests.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
