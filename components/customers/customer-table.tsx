"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomers, useReorderCustomers, useBulkUpdateStatus, useBulkDeleteCustomers } from "@/hooks/use-customers";
import { Customer, CustomerFilters, SortDirection, SortField } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { CustomerAvatar } from "./customer-avatar";
import { SortableCustomerRow } from "./sortable-customer-row";
import { FiltersPanel } from "./filters-panel";
import { AddCustomerDialog } from "./add-customer-dialog";
import { CustomerDetailsDialog } from "./customer-details-dialog";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal, Move, Download, X } from "lucide-react";
import { applyFilters, countActiveFilters, createEmptyFilters } from "@/lib/filter-utils";
import { customersToCSV, downloadCSV } from "@/lib/csv-export";
import { useToast } from "@/components/toast-provider";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Simple debounce hook — delays updating the "committed" search value
// until the user pauses typing, so we don't re-filter on every keystroke.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return debounced;
}

// DndContext renders hidden accessibility helper elements wherever it's
// mounted — it must wrap the whole <table>, not sit inside <tbody>, or
// React ends up with an invalid <div> nested directly inside <tbody>
// (which is what was causing the hydration error).
function TableWrapper({
  manualReorderMode,
  sensors,
  onDragEnd,
  children,
}: {
  manualReorderMode: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  children: React.ReactNode;
}) {
  if (!manualReorderMode) return <>{children}</>;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
}

export function CustomerTable() {
  const { data: customers, isLoading, isError, error } = useCustomers();
  const reorderCustomers = useReorderCustomers();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "name",
    direction: "asc",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [filters, setFilters] = useState<CustomerFilters>(createEmptyFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Manual reorder mode: dragging only produces a visible effect when the
  // table isn't actively sorted by a column (otherwise it would just
  // re-sort back on the next render), so we toggle sort off while active.
  const [manualReorderMode, setManualReorderMode] = useState(false);

  // Bulk selection — a Set so it can span multiple pages if the user
  // navigates while some rows are selected.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Cmd/Ctrl+K opens the filters panel from anywhere on the page.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFiltersOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function openDetails(customer: Customer) {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  }

  const companies = useMemo(() => {
    if (!customers) return [];
    return Array.from(new Set(customers.map((c) => c.company))).sort();
  }, [customers]);

  const filteredAndSorted = useMemo(() => {
    if (!customers) return [];

    const filteredByPanel = applyFilters(customers, filters);

    const query = debouncedSearch.trim().toLowerCase();
    const filtered = query
      ? filteredByPanel.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.company.toLowerCase().includes(query)
        )
      : filteredByPanel;

    const sorted = manualReorderMode
      ? filtered // preserve the underlying stored order so drag positions are stable
      : [...filtered].sort((a, b) => {
          const aVal = a[sort.field];
          const bVal = b[sort.field];
          const cmp = aVal.localeCompare(bVal);
          return sort.direction === "asc" ? cmp : -cmp;
        });

    return sorted;
  }, [customers, filters, debouncedSearch, sort, manualReorderMode]);

  function handleApplyFilters(next: CustomerFilters) {
    setFilters(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function toggleSort(field: SortField) {
    if (manualReorderMode) return; // sorting is disabled while manually reordering
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" }
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = paginated.findIndex((c) => c.id === active.id);
    const newIndex = paginated.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPage = arrayMove(paginated, oldIndex, newIndex);
    reorderCustomers.mutate(reorderedPage.map((c) => c.id));
  }

  const allOnPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));
  const someOnPageSelected = paginated.some((c) => selectedIds.has(c.id));

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((c) => next.delete(c.id));
      } else {
        paginated.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkStatus(status: "active" | "inactive") {
    const ids = Array.from(selectedIds);
    bulkUpdateStatus.mutate(
      { ids, status },
      {
        onSuccess: () => {
          toast({
            title: `${ids.length} customer${ids.length !== 1 ? "s" : ""} updated`,
            description: `Status set to ${status}.`,
            variant: "success",
          });
          setSelectedIds(new Set());
        },
        onError: (err) => {
          toast({
            title: "Bulk update failed",
            description: err instanceof Error ? err.message : "Please try again.",
            variant: "error",
          });
        },
      }
    );
  }

  function handleExportCSV() {
    // Exports the currently filtered/searched/sorted set (not just the
    // visible page), matching "Export filtered customers as CSV".
    const csv = customersToCSV(filteredAndSorted);
    downloadCSV(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({
      title: "Export started",
      description: `${filteredAndSorted.length} customer${
        filteredAndSorted.length !== 1 ? "s" : ""
      } exported.`,
      variant: "success",
    });
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sort.field !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sort.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load customers{error instanceof Error ? `: ${error.message}` : ""}.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm w-full">
            <Input
              placeholder="Search by name, email, or company..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1); // reset to first page on new search
              }}
              className="pr-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            <kbd className="hidden sm:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApplyFilters(createEmptyFilters())}
            >
              Clear filters
            </Button>
          )}
          <Button
            variant={manualReorderMode ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            disabled={selectedIds.size > 0}
            onClick={() => setManualReorderMode((v) => !v)}
          >
            <Move className="h-3.5 w-3.5" />
            {manualReorderMode ? "Done reordering" : "Reorder rows"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredAndSorted.length} customer{filteredAndSorted.length !== 1 ? "s" : ""}
        </span>
        <AddCustomerDialog />
      </div>

      <FiltersPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        appliedFilters={filters}
        onApply={handleApplyFilters}
        companies={companies}
      />

      {selectedIds.size > 0 && !manualReorderMode && (
        <div className="flex items-center gap-3 rounded-lg border bg-accent/40 px-4 py-2.5 flex-wrap">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("active")}>
            Set Active
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkStatus("inactive")}>
            Set Inactive
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      {manualReorderMode && (
        <p className="text-xs text-muted-foreground">
          Drag the handle to reorder rows within this page. Column sorting is disabled while
          reordering.
        </p>
      )}

      <div className="rounded-md border overflow-x-auto">
        <TableWrapper manualReorderMode={manualReorderMode} sensors={sensors} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                {manualReorderMode ? (
                  <TableHead className="w-8" />
                ) : (
                  <TableHead className="w-8">
                    <Checkbox
                      checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                      onCheckedChange={toggleSelectAllOnPage}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                )}
                <TableHead>
                  <button
                    className="flex items-center font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => toggleSort("name")}
                    disabled={manualReorderMode}
                  >
                    Name <SortIcon field="name" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => toggleSort("email")}
                    disabled={manualReorderMode}
                  >
                    Email <SortIcon field="email" />
                  </button>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => toggleSort("company")}
                    disabled={manualReorderMode}
                  >
                    Company <SortIcon field="company" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => toggleSort("status")}
                    disabled={manualReorderMode}
                  >
                    Status <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => toggleSort("lastContact")}
                    disabled={manualReorderMode}
                  >
                    Last Contact <SortIcon field="lastContact" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Simple skeleton rows while the mock API "loads" (7 cols:
                // checkbox/handle + name + email + phone + company + status + last contact)
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : manualReorderMode ? (
                <SortableContext
                  items={paginated.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {paginated.map((customer) => (
                    <SortableCustomerRow
                      key={customer.id}
                      customer={customer}
                      onOpenDetails={openDetails}
                      formatDate={formatDate}
                    />
                  ))}
                </SortableContext>
              ) : (
                paginated.map((customer: Customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetails(customer)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(customer.id)}
                        onCheckedChange={() => toggleSelectOne(customer.id)}
                        aria-label={`Select ${customer.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={customer.name} />
                        {customer.name}
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell>{formatDate(customer.lastContact)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span>Rows per page:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                setPage(1);
              }}
              className={`px-2 py-1 rounded ${
                pageSize === size ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={() => {
          setDetailsOpen(false);
          setEditOpen(true);

        }}
        onDelete={() => {
          setDetailsOpen(false);
          setDeleteOpen(true);
        }}
      />

      <EditCustomerDialog
        customer={selectedCustomer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteConfirmDialog
        customer={selectedCustomer}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <BulkDeleteDialog
        ids={Array.from(selectedIds)}
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onDeleted={() => setSelectedIds(new Set())}
      />
    </div>
  );
}