import { Users } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { ThemeToggle } from "@/components/theme-toggle";


export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
              <p className="text-muted-foreground text-sm">
                Manage and search your customer list.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-xl border bg-card shadow-sm p-6">
          <CustomerTable />
        </div>
      </div>
    </main>
  );
}