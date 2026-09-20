import { useListUsers } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock3, Loader2, Mail, Phone, UserRound } from "lucide-react";
import { PageMeta } from "@/components/page-meta";

function onboardingBadge(completed: boolean) {
  return completed ? (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
      <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock3 className="mr-1 h-3 w-3" /> Not completed
    </Badge>
  );
}

export default function AdminUsersPage() {
  const { data: users, isLoading } = useListUsers();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading members
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <PageMeta title="Members" description="Private EcomStack member directory." />
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Private admin area</p>
        <h1 className="mt-2 text-3xl font-medium">Members</h1>
        <p className="mt-2 text-muted-foreground">Contact details and onboarding progress are visible only to authorised administrators.</p>
      </div>

      <div className="space-y-4 md:hidden">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.fullName || "Profile not completed"}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{user.id}</p>
                </div>
                <Badge variant="secondary">{user.role}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {user.email || "No email saved"}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {user.phoneNumber ? [user.phoneCountryCode, user.phoneNumber].filter(Boolean).join(" ") : "No phone saved"}</p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-4">
                {onboardingBadge(user.onboardingCompleted)}
                <span className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{user.fullName || "Profile not completed"}</p>
                        <p className="max-w-44 truncate font-mono text-[11px] text-muted-foreground">{user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email || "—"}</TableCell>
                  <TableCell>{user.phoneNumber ? [user.phoneCountryCode, user.phoneNumber].filter(Boolean).join(" ") : "—"}</TableCell>
                  <TableCell>{onboardingBadge(user.onboardingCompleted)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No members found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}