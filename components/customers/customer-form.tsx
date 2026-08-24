"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customerFormSchema, CustomerFormValues } from "@/lib/schema";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const EMPTY_DEFAULTS: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "active",
  lastContact: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: CustomerFormProps) {
  // Three type params instead of the usual one: customerFormSchema uses
  // z.optional().default(...) on `company`/`notes`, so Zod's *input* type
  // (what the form fields hold before submit, where those can be
  // undefined) differs from its *output* type (after parsing, where the
  // defaults have been applied and they're always strings). Passing only
  // CustomerFormValues (the output type) as the single generic would make
  // react-hook-form think `company`/`notes` are required from the start,
  // which conflicts with how the resolver actually types them pre-submit.
  const form = useForm<
  z.input<typeof customerFormSchema>,
  unknown,
  CustomerFormValues
>({
  resolver: zodResolver(customerFormSchema),
  defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
});

  // Re-sync the form whenever a different customer's defaultValues come in
  // (e.g. opening Edit for a different row while the dialog stays mounted).
  useEffect(() => {
    form.reset({ ...EMPTY_DEFAULTS, ...defaultValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Contact Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Meeting notes and follow-up items..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}