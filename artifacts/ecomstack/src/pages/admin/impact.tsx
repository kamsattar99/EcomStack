import { useGetSyncStatus, useRunImpactDiagnostic, useRunImpactSync } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Activity, Play, RefreshCcw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSyncStatusQueryKey } from "@workspace/api-client-react";

export default function AdminImpactPage() {
  const { data: status, isLoading } = useGetSyncStatus();
  const runDiagnostic = useRunImpactDiagnostic();
  const runSync = useRunImpactSync();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDiagnostic = () => {
    runDiagnostic.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Diagnostic check complete" });
        queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
      }
    });
  };

  const handleSync = () => {
    runSync.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Sync triggered" });
        queryClient.invalidateQueries({ queryKey: getGetSyncStatusQueryKey() });
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading status...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-medium">Impact Diagnostics & Sync</h1>
        <p className="text-muted-foreground mt-1">Monitor the connection and parameter matching with Impact Radius.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" /> System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Credentials Present</span>
              {status?.credentialsPresent ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">System Enabled</span>
              {status?.enabled ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
            </div>
            
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground flex items-center mb-1"><Clock className="h-3 w-3 mr-1" /> Last Checked</p>
                <p className="font-medium text-sm">{status?.lastCheckedAt ? new Date(status.lastCheckedAt).toLocaleString() : 'Never'}</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground flex items-center mb-1"><Clock className="h-3 w-3 mr-1" /> Last Success</p>
                <p className="font-medium text-sm">{status?.lastSuccessAt ? new Date(status.lastSuccessAt).toLocaleString() : 'Never'}</p>
              </div>
            </div>

            {status?.error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sync Error</AlertTitle>
                <AlertDescription className="text-xs font-mono break-all">{status.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleDiagnostic} disabled={runDiagnostic.isPending} variant="outline" className="flex-1">
                {runDiagnostic.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run Diagnostic
              </Button>
              <Button onClick={handleSync} disabled={runSync.isPending} className="flex-1">
                {runSync.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Force Sync
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Message Log</CardTitle>
            <CardDescription>Recent system output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded-md p-4 text-green-400 font-mono text-sm h-[260px] overflow-auto">
              {status?.message || "No recent messages."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif">Recent Diagnostic Records</CardTitle>
          <CardDescription>Sample of recent conversions and their tracked parameters to verify mapping.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Event Tracker</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-center">SubId1</TableHead>
                  <TableHead className="text-center">SubId2</TableHead>
                  <TableHead className="text-center">SubId3</TableHead>
                  <TableHead className="text-center">SharedId</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status?.records?.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{r.campaignName}</div>
                      <div className="text-xs text-muted-foreground">{r.campaignId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.eventTrackerName}</div>
                      <div className="text-xs text-muted-foreground">{r.eventTrackerId}</div>
                    </TableCell>
                    <TableCell>{r.state}</TableCell>
                    <TableCell className="text-center">{r.hasSubId1 ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : '-'}</TableCell>
                    <TableCell className="text-center">{r.hasSubId2 ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : '-'}</TableCell>
                    <TableCell className="text-center">{r.hasSubId3 ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : '-'}</TableCell>
                    <TableCell className="text-center">{r.hasSharedId ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" /> : '-'}</TableCell>
                  </TableRow>
                ))}
                {(!status?.records || status.records.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No records found in last diagnostic. Run diagnostic to fetch fresh sample.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
