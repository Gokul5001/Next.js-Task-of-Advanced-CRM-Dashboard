"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { CustomerAvatar } from "./customer-avatar";
import { Customer } from "@/lib/types";
import { GripVertical } from "lucide-react";

interface SortableCustomerRowProps {
  customer: Customer;
  onOpenDetails: (customer: Customer) => void;
  formatDate: (dateStr: string) => string;
}

export function SortableCustomerRow({
  customer,
  onOpenDetails,
  formatDate,
}: SortableCustomerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: customer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50">
      <TableCell className="w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
          aria-label={`Drag to reorder ${customer.name}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell
        className="font-medium cursor-pointer"
        onClick={() => onOpenDetails(customer)}
      >
        <div className="flex items-center gap-3">
          <CustomerAvatar name={customer.name} />
          {customer.name}
        </div>
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => onOpenDetails(customer)}>
        {customer.email}
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => onOpenDetails(customer)}>
        {customer.phone}
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => onOpenDetails(customer)}>
        {customer.company}
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => onOpenDetails(customer)}>
        <StatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="cursor-pointer" onClick={() => onOpenDetails(customer)}>
        {formatDate(customer.lastContact)}
      </TableCell>
    </TableRow>
  );
}