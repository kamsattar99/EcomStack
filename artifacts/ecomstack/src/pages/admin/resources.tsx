import { Link } from "wouter";
import { useListAdminResources } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, FileText } from "lucide-react";

export default function AdminResourcesPage() {
  const { data: resources, isLoading } = useListAdminResources();

  if (isLoading) {
    return <div className="p-8">Loading resources...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium">Manage Resources</h1>
          <p className="text-muted-foreground mt-1">Create and edit prompts, skills, and cheat sheets.</p>
        </div>
        <Button asChild className="rounded-full shadow-sm">
          <Link href="/admin/resources/new">
            <Plus className="h-4 w-4 mr-2" /> New Resource
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Demo/Free</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  No resources found. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              resources?.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.title}
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">{r.slug}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="font-normal bg-background">{r.type}</Badge></TableCell>
                  <TableCell>
                    <Badge 
                      variant={r.status === 'published' ? 'default' : r.status === 'draft' ? 'secondary' : 'outline'}
                      className={r.status === 'published' ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20' : ''}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.isFree && <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0">Free</Badge>}
                      {r.isDemo && <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-[10px] h-4 px-1 py-0 border-amber-200">Demo</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="h-8">
                      <Link href={`/admin/resources/${r.id}`}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
