"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkDeleteCustomers } from "@/hooks/use-customers";
import { useToast } from "@/components/toast-provider";

interface BulkDeleteDialogProps {
  ids: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function BulkDeleteDialog({ ids, open, onOpenChange, onDeleted }: BulkDeleteDialogProps) {
  const bulkDelete = useBulkDeleteCustomers();
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await bulkDelete.mutateAsync(ids);
      toast({
        title: `${ids.length} customer${ids.length !== 1 ? "s" : ""} deleted`,
        variant: "success",
      });
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Bulk delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {ids.length} customer{ids.length !== 1 ? "s" : ""}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will permanently remove the selected customers. This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={bulkDelete.isPending}>
            {bulkDelete.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
