import { useGetAdminOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MousePointerClick, CheckCircle, FileText, Download, HelpCircle, Activity } from "lucide-react";

export default function AdminOverviewPage() {
  const { data: overview, isLoading } = useGetAdminOverview();

  if (isLoading) {
    return <div className="p-8">Loading overview...</div>;
  }

  if (!overview) return null;

  const stats = [
    { label: "Registered Users", value: overview.registeredUsers, icon: Users },
    { label: "Vault Members", value: overview.accountsWithAccess, icon: CheckCircle },
    { label: "Onboarding Complete", value: overview.onboardingCompletions, icon: CheckCircle },
    { label: "Verified Trials", value: overview.verifiedPaidTrials, icon: CheckCircle },
    { label: "Total Resources", value: overview.resources, icon: FileText },
    { label: "Resource Copies", value: overview.resourceCopies, icon: MousePointerClick },
    { label: "Resource Downloads", value: overview.resourceDownloads, icon: Download },
    { label: "Open Support", value: overview.openSupportRequests, icon: HelpCircle },
    { label: "Signup Clicks", value: overview.signupClicks, icon: MousePointerClick },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-serif font-medium mb-8">Admin Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Recent Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overview.audit.length > 0 ? overview.audit.map(item => (
                <div key={item.id} className="flex justify-between items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.actorId.substring(0,8)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent audit logs.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
