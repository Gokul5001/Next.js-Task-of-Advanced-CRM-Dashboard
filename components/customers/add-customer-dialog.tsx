"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "./customer-form";
import { useAddCustomer } from "@/hooks/use-customers";
import { useToast } from "@/components/toast-provider";
import { CustomerFormValues } from "@/lib/schema";
import { Plus } from "lucide-react";

export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const addCustomer = useAddCustomer();
  const { toast } = useToast();

  async function handleSubmit(values: CustomerFormValues) {
    try {
      await addCustomer.mutateAsync({
        ...values,
        company: values.company ?? "",
        notes: values.notes ?? "",
      });
      toast({
        title: "Customer added",
        description: `${values.name} was added successfully.`,
        variant: "success",
      });
      setOpen(false);
    } catch (err) {
      toast({
        title: "Failed to add customer",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Customer
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isSubmitting={addCustomer.isPending}
          submitLabel="Add Customer"
        />
      </DialogContent>
    </Dialog>
  );
}
