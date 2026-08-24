"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteCustomer } from "@/hooks/use-customers";
import { useToast } from "@/components/toast-provider";
import { Customer } from "@/lib/types";

interface DeleteConfirmDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({ customer, open, onOpenChange }: DeleteConfirmDialogProps) {
  const deleteCustomer = useDeleteCustomer();
  const { toast } = useToast();

  async function handleDelete() {
    if (!customer) return;
    try {
      await deleteCustomer.mutateAsync(customer.id);
      toast({
        title: "Customer deleted",
        description: `${customer.name} was removed.`,
        variant: "success",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to delete customer",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete customer?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will permanently remove <span className="font-medium">{customer.name}</span> from
          your customer list. This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCustomer.isPending}
          >
            {deleteCustomer.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
