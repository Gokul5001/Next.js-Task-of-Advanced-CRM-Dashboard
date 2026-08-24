import { Customer } from "./types";

// CSV quoting rule: a value only needs to be wrapped in quotes if it
// contains a character that would otherwise be misread as a field/row
// separator or as the start of a quoted field (comma, double quote, or
// newline). When quoting is needed, any literal double quotes inside the
// value must themselves be doubled ("" ) so the parser doesn't treat them
// as the closing quote.
function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = ["Name", "Email", "Phone", "Company", "Status", "Last Contact", "Notes"];

export function customersToCSV(customers: Customer[]): string {
  const rows = customers.map((c) =>
    [c.name, c.email, c.phone, c.company, c.status, c.lastContact, c.notes]
      .map((v) => escapeCsvValue(String(v ?? "")))
      .join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function downloadCSV(filename: string, csvContent: string) {
  // Prefix with a BOM so Excel opens the file as UTF-8 instead of guessing wrong.
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}