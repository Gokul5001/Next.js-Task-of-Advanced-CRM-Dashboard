import { Customer, CustomerFilters } from "./types";

export function createEmptyFilters(): CustomerFilters {
  return {
    status: [],
    companies: [],
    dateFrom: undefined,
    dateTo: undefined,
    phone: "",
    email: "",
  };
}

// All active filter fields are combined with AND, not OR — a customer must
// pass every filter that currently has a value to be included. Within the
// `status` and `companies` arrays specifically, matching ANY one of the
// selected values counts as passing that individual filter (e.g. status
// ["active", "inactive"] would match either), it's only across *different*
// filter fields that the logic becomes AND.
export function applyFilters(customers: Customer[], filters: CustomerFilters): Customer[] {
  return customers.filter((c) => {
    if (filters.status.length > 0 && !filters.status.includes(c.status)) return false;
    if (filters.companies.length > 0 && !filters.companies.includes(c.company)) return false;
    if (filters.dateFrom && c.lastContact < filters.dateFrom) return false;
    if (filters.dateTo && c.lastContact > filters.dateTo) return false;
    if (filters.phone && !c.phone.includes(filters.phone.trim())) return false;
    if (filters.email && !c.email.toLowerCase().includes(filters.email.trim().toLowerCase()))
      return false;
    return true;
  });
}

export function countActiveFilters(filters: CustomerFilters): number {
  let count = 0;
  if (filters.status.length > 0) count += 1;
  if (filters.companies.length > 0) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  if (filters.phone) count += 1;
  if (filters.email) count += 1;
  return count;
}

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Computed fresh each time (not persisted) since "Recent Contacts" is
// relative to today's date.
export function getFilterTemplates(): { name: string; filters: CustomerFilters }[] {
  return [
    {
      name: "Active Customers",
      filters: { ...createEmptyFilters(), status: ["active"] },
    },
    {
      name: "Recent Contacts",
      filters: {
        ...createEmptyFilters(),
        dateFrom: isoDateDaysAgo(30),
        dateTo: isoDateDaysAgo(0),
      },
    },
    {
      name: "Inactive Leads",
      filters: { ...createEmptyFilters(), status: ["inactive"] },
    },
  ];
}