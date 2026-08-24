"use client";

import { useEffect, useState } from "react";
import { CustomerFilters, SavedFilter } from "@/lib/types";

const SAVED_FILTERS_KEY = "crm-saved-filters";

function loadFromStorage(): SavedFilter[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SAVED_FILTERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedFilter[];
  } catch {
    return [];
  }
}

function persistToStorage(filters: SavedFilter[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
}

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load from localStorage after mount to avoid SSR/client markup mismatch.
  useEffect(() => {
    setSavedFilters(loadFromStorage());
  }, []);

  function saveFilter(name: string, filters: CustomerFilters) {
    const newFilter: SavedFilter = {
      id: `saved-${Date.now()}`,
      name,
      filters,
    };
    setSavedFilters((prev) => {
      const updated = [...prev, newFilter];
      persistToStorage(updated);
      return updated;
    });
  }

  function deleteFilter(id: string) {
    setSavedFilters((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      persistToStorage(updated);
      return updated;
    });
  }

  return { savedFilters, saveFilter, deleteFilter };
}