import { Customer, CreateCustomerInput, UpdateCustomerInput, CustomerStatus } from "./types";

const STORAGE_KEY = "crm-customers";
const SIMULATED_DELAY_MS = 400;

// ---- Seed data -------------------------------------------------------

const FIRST_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
  "Ivan", "Julia", "Kevin", "Laura", "Marcus", "Nina", "Oscar", "Priya",
];

const LAST_NAMES = [
  "Green", "Ross", "Davis", "Ray", "Ross", "Chen", "Martinez", "Patel",
  "Nguyen", "Kim", "Brooks", "Ward", "Hughes", "Foster",
];

const COMPANIES = ["Acme Corp", "Globex", "Stark Industries", "Innovatech", "Umbrella Co"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinLastYear(): string {
  const now = Date.now();
  const past = now - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000;
  return new Date(past).toISOString().slice(0, 10);
}

function generateSeedCustomers(count: number): Customer[] {
  return Array.from({ length: count }, (_, i) => {
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    const company = randomFrom(COMPANIES);
    return {
      id: `seed-${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      phone: `+1 (555) ${String(100 + Math.floor(Math.random() * 900)).slice(0, 3)}-${String(
        1000 + Math.floor(Math.random() * 9000)
      ).slice(0, 4)}`,
      company,
      status: Math.random() > 0.35 ? "active" : "inactive",
      lastContact: randomDateWithinLastYear(),
      notes: "",
      createdAt: randomDateWithinLastYear(),
    };
  });
}

// ---- Storage helpers ---------------------------------------------------
// Persists to localStorage so data survives refreshes, but falls back to
// a fresh in-memory seed on the server / first load.

function loadCustomers(): Customer[] {
  if (typeof window === "undefined") return generateSeedCustomers(150);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Customer[];
    } catch {
      // fall through to reseed on parse failure
    }
  }
  const seeded = generateSeedCustomers(150);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveCustomers(customers: Customer[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function delay(ms: number = SIMULATED_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ---- Public API ---------------------------------------------------------
// Every function simulates network latency so React Query's loading
// states are actually visible during development.

export async function getCustomers(): Promise<Customer[]> {
  await delay();
  return loadCustomers();
}

export async function addCustomer(input: CreateCustomerInput): Promise<Customer> {
  await delay();
  const customers = loadCustomers();
  const newCustomer: Customer = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const updated = [newCustomer, ...customers];
  saveCustomers(updated);
  return newCustomer;
}

export async function updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
  await delay();
  const customers = loadCustomers();
  const index = customers.findIndex((c) => c.id === input.id);
  if (index === -1) {
    throw new Error(`Customer with id ${input.id} not found`);
  }
  const updatedCustomer: Customer = { ...customers[index], ...input };
  const updated = [...customers];
  updated[index] = updatedCustomer;
  saveCustomers(updated);
  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<void> {
  await delay();
  const customers = loadCustomers();
  const updated = customers.filter((c) => c.id !== id);
  saveCustomers(updated);
}

// Reorders only the given subset of ids relative to each other, while every
// other customer keeps its original position. This matters because drag-and
// -drop only ever hands us the *visible* (filtered/paginated) ids — a naive
// "replace the whole list with this order" would silently delete everyone
// else from storage.
export async function reorderCustomers(orderedIds: string[]): Promise<Customer[]> {
  await delay(150);
  const customers = loadCustomers();
  const idSet = new Set(orderedIds);
  const byId = new Map(customers.filter((c) => idSet.has(c.id)).map((c) => [c.id, c]));
  const queue = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Customer[];

  let i = 0;
  const merged = customers.map((c) => (idSet.has(c.id) ? queue[i++] : c));

  saveCustomers(merged);
  return merged;
}

export async function bulkUpdateStatus(
  ids: string[],
  status: CustomerStatus
): Promise<Customer[]> {
  await delay();
  const customers = loadCustomers();
  const idSet = new Set(ids);
  const updated = customers.map((c) => (idSet.has(c.id) ? { ...c, status } : c));
  saveCustomers(updated);
  return updated;
}

export async function bulkDeleteCustomers(ids: string[]): Promise<void> {
  await delay();
  const customers = loadCustomers();
  const idSet = new Set(ids);
  const updated = customers.filter((c) => !idSet.has(c.id));
  saveCustomers(updated);
}