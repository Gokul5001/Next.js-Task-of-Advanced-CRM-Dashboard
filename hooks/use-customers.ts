"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  reorderCustomers,
  bulkUpdateStatus,
  bulkDeleteCustomers,
} from "@/lib/api";
import { Customer, CreateCustomerInput, UpdateCustomerInput, CustomerStatus } from "@/lib/types";

// Single source of truth for the query key so every hook here
// (and any component that wants to invalidate it) stays in sync.
export const customersQueryKey = ["customers"] as const;

export function useCustomers() {
  return useQuery({
    queryKey: customersQueryKey,
    queryFn: getCustomers,
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => addCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    // Optimistic update: remove the row immediately instead of waiting
    // on the round trip, then roll back if the mutation fails.
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: customersQueryKey });
      const previous = queryClient.getQueryData<Customer[]>(customersQueryKey);

      queryClient.setQueryData<Customer[]>(customersQueryKey, (old) =>
        old ? old.filter((c) => c.id !== id) : old
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(customersQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}

export function useReorderCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderCustomers(orderedIds),
    // Optimistic reorder so drag-and-drop feels instant. Uses the same
    // "reorder subset in place, leave everyone else untouched" merge as
    // the mock API — orderedIds is usually just the current page/filtered
    // view, not the entire customer list.
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: customersQueryKey });
      const previous = queryClient.getQueryData<Customer[]>(customersQueryKey);

      if (previous) {
        const idSet = new Set(orderedIds);
        const byId = new Map(previous.filter((c) => idSet.has(c.id)).map((c) => [c.id, c]));
        const queue = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Customer[];
        let i = 0;
        const merged = previous.map((c) => (idSet.has(c.id) ? queue[i++] : c));
        queryClient.setQueryData(customersQueryKey, merged);
      }

      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(customersQueryKey, context.previous);
      }
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: CustomerStatus }) =>
      bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}

export function useBulkDeleteCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteCustomers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}