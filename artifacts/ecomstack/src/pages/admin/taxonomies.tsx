import { useState } from "react";
import { useListTaxonomies, useCreateTaxonomy, useUpdateTaxonomy, useDeleteTaxonomy } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListTaxonomiesQueryKey } from "@workspace/api-client-react";

export default function AdminTaxonomiesPage() {
  const { data: taxonomies, isLoading } = useListTaxonomies();
  const createTaxonomy = useCreateTaxonomy();
  const updateTaxonomy = useUpdateTaxonomy();
  const deleteTaxonomy = useDeleteTaxonomy();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<'category' | 'tool' | 'tag'>('category');

  if (isLoading) return <div className="p-8">Loading taxonomies...</div>;

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setKind('category');
    setOpen(true);
  };

  const handleOpenEdit = (tax: any) => {
    setEditingId(tax.id);
    setName(tax.name);
    setKind(tax.kind as any);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this taxonomy?")) return;
    deleteTaxonomy.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getListTaxonomiesQueryKey() });
      }
    });
  };

  const handleSubmit = () => {
    if (!name || !kind) return;
    
    const data = { name, kind };
    
    if (editingId) {
      updateTaxonomy.mutate({ id: editingId, data }, {
        onSuccess: () => {
          toast({ title: "Updated successfully" });
          queryClient.invalidateQueries({ queryKey: getListTaxonomiesQueryKey() });
          setOpen(false);
        }
      });
    } else {
      createTaxonomy.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Created successfully" });
          queryClient.invalidateQueries({ queryKey: getListTaxonomiesQueryKey() });
          setOpen(false);
        }
      });
    }
  };

  const isSaving = createTaxonomy.isPending || updateTaxonomy.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium">Taxonomies</h1>
          <p className="text-muted-foreground mt-1">Manage categories, tools, and tags used across resources.</p>
        </div>
        <Button onClick={handleOpenNew} className="rounded-full shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> New Entry
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxonomies?.map(tax => (
              <TableRow key={tax.id}>
                <TableCell className="font-medium">{tax.name}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{tax.kind}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tax)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tax.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {taxonomies?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No taxonomies found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Taxonomy' : 'New Taxonomy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving || !name}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
