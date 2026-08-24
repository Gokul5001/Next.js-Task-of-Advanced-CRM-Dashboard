"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CustomerFilters } from "@/lib/types";
import { createEmptyFilters, getFilterTemplates } from "@/lib/filter-utils";
import { useSavedFilters } from "@/hooks/use-saved-filters";
import { X, Trash2 } from "lucide-react";

interface FiltersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliedFilters: CustomerFilters;
  onApply: (filters: CustomerFilters) => void;
  companies: string[];
}

export function FiltersPanel({
  open,
  onOpenChange,
  appliedFilters,
  onApply,
  companies,
}: FiltersPanelProps) {
  // Draft state so edits inside the panel don't affect the table
  // until "Apply Filters" is pressed. Resyncs whenever the panel opens.
  const [draft, setDraft] = useState<CustomerFilters>(appliedFilters);
  const [saveName, setSaveName] = useState("");
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();

  useEffect(() => {
    if (open) setDraft(appliedFilters);
  }, [open, appliedFilters]);

  function toggleStatus(status: "active" | "inactive") {
    setDraft((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  }

  function toggleCompany(company: string) {
    setDraft((prev) => ({
      ...prev,
      companies: prev.companies.includes(company)
        ? prev.companies.filter((c) => c !== company)
        : [...prev.companies, company],
    }));
  }

  function handleApply() {
    onApply(draft);
    onOpenChange(false);
  }

  function handleClearAll() {
    const empty = createEmptyFilters();
    setDraft(empty);
    onApply(empty);
  }

  function handleSave() {
    if (!saveName.trim()) return;
    saveFilter(saveName.trim(), draft);
    setSaveName("");
  }

  function applySaved(filters: CustomerFilters) {
    setDraft(filters);
    onApply(filters);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {/* Save current filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Name this filter..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!saveName.trim()}>
              Save Filter
            </Button>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Status</Label>
            </div>
            <div className="space-y-2">
              {(["active", "inactive"] as const).map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={draft.status.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Label htmlFor={`status-${status}`} className="capitalize font-normal">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Company (checkbox list acting as multi-select) */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Company</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {companies.map((company) => (
                <div key={company} className="flex items-center gap-2">
                  <Checkbox
                    id={`company-${company}`}
                    checked={draft.companies.includes(company)}
                    onCheckedChange={() => toggleCompany(company)}
                  />
                  <Label htmlFor={`company-${company}`} className="font-normal">
                    {company}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Date Range (Last Contact)
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={draft.dateFrom ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))
                  }
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={draft.dateTo ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, dateTo: e.target.value || undefined }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone-filter" className="text-sm font-semibold mb-2 block">
              Phone Number
            </Label>
            <Input
              id="phone-filter"
              placeholder="e.g. 555-1234"
              value={draft.phone ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email-filter" className="text-sm font-semibold mb-2 block">
              Email Contains
            </Label>
            <Input
              id="email-filter"
              placeholder="e.g. @acme.com"
              value={draft.email ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>

          {/* Templates */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Filter Templates</Label>
            <div className="flex flex-col gap-1">
              {getFilterTemplates().map((template) => (
                <button
                  key={template.name}
                  onClick={() => applySaved(template.filters)}
                  className="text-left text-sm px-2 py-1.5 rounded hover:bg-muted"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Saved filters */}
          {savedFilters.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Saved Filters</Label>
              <div className="flex flex-col gap-1">
                {savedFilters.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between rounded hover:bg-muted px-2 py-1.5"
                  >
                    <button
                      onClick={() => applySaved(saved.filters)}
                      className="text-left text-sm flex-1"
                    >
                      {saved.name}
                    </button>
                    <button
                      onClick={() => deleteFilter(saved.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${saved.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
