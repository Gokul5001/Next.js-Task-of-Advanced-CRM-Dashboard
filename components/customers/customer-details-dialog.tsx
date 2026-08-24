"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Customer } from "@/lib/types";

interface CustomerDetailsDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CustomerDetailsDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{customer.name}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit Customer
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Email</p>
            <p>{customer.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Phone</p>
            <p>{customer.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Company</p>
            <p>{customer.company || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Status</p>
            <StatusBadge status={customer.status} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Last Contact</p>
            <p>{formatDate(customer.lastContact)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Customer Since</p>
            <p>{formatDate(customer.createdAt)}</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-xs mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap rounded-md border p-3 min-h-[60px] bg-muted/30">
            {customer.notes || "No notes yet."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
