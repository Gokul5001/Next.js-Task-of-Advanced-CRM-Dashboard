"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import { useUpdateCustomer } from "@/hooks/use-customers";
import { useToast } from "@/components/toast-provider";
import { Customer } from "@/lib/types";
import { CustomerFormValues } from "@/lib/schema";

interface EditCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  const updateCustomer = useUpdateCustomer();
  const { toast } = useToast();

  async function handleSubmit(values: CustomerFormValues) {
    if (!customer) return;
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        ...values,
        company: values.company ?? "",
        notes: values.notes ?? "",
      });
      toast({
        title: "Customer updated",
        description: `${values.name} was updated successfully.`,
        variant: "success",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to update customer",
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
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          defaultValues={{
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            company: customer.company,
            status: customer.status,
            lastContact: customer.lastContact,
            notes: customer.notes,
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={updateCustomer.isPending}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}
