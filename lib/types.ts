export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  lastContact: string; // ISO date string, e.g. "2023-11-12"
  notes: string;
  createdAt: string; // ISO date string
}

// Payload shapes used by the mock API / mutations.
// (id, createdAt are server-assigned, so they're omitted from input.)
export type CreateCustomerInput = Omit<Customer, "id" | "createdAt">;
export type UpdateCustomerInput = Partial<CreateCustomerInput> & { id: string };

export interface CustomerFilters {
  status: CustomerStatus[]; // empty array = no status filter applied
  companies: string[]; // empty array = no company filter applied
  dateFrom?: string; // ISO date, inclusive
  dateTo?: string; // ISO date, inclusive
  phone?: string; // partial match
  email?: string; // partial match
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: CustomerFilters;
}

export type SortField = "name" | "email" | "lastContact";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
