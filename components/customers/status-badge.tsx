import { Badge } from "@/components/ui/badge";
import { CustomerStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className={
        status === "active"
          ? "bg-green-100 text-green-800 hover:bg-green-100"
          : "bg-gray-100 text-gray-600 hover:bg-gray-100"
      }
    >
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}