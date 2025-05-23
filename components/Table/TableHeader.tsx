// TableHeader.tsx
"use client"

import { ArrowUpDown, ChevronDown } from "lucide-react";
import TableCheckbox from "./TableCheckbox";
import { ColumnDef, SortDirection } from "./types";

interface TableHeaderProps<T> {
  columns: ColumnDef<T>[];
  showCheckbox: boolean;
  onSelectAll: (isSelected: boolean) => void;
  requestSort: (key: keyof T) => void;
  sortConfig: { key: keyof T; direction: SortDirection } | null;
  showActions: boolean;
  allSelected: boolean;
}

export default function TableHeader<T>({
  columns,
  showCheckbox,
  onSelectAll,
  requestSort,
  sortConfig,
  showActions,
  allSelected,
}: TableHeaderProps<T>) {
  return (
    <thead className="bg-[#F8F9FA]">
      <tr>
        {showCheckbox && (
          <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
            <TableCheckbox
              checked={allSelected}
              onChange={(checked) => onSelectAll(checked)}
              className="absolute left-4 top-1/2 -translate-y-1/2"
            />
          </th>
        )}

        {columns.map((column, idx) => (
          <th
            key={column.accessorKey as string}
            scope="col"
            className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 ${
              idx === 0 && !showCheckbox ? "pl-6" : ""
            } ${column.enableSorting ? "cursor-pointer" : ""}`}
            style={{ width: column.size ? `${column.size}px` : "auto" }}
            onClick={() =>
              column.enableSorting && requestSort(column.accessorKey)
            }
          >
            <div className="flex items-center border-l border-[#C5D2E799] pl-3">
              {column.enableSorting ? (
                <button className="flex items-center gap-1">
                  {column.header}
                  {sortConfig?.key === column.accessorKey ? (
                    <ArrowUpDown className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  )}
                </button>
              ) : (
                column.header
              )}
            </div>
          </th>
        ))}

        {showActions && (
          <th scope="col" className="relative py-3.5 pl-3 pr-6">
            <span className="sr-only">Actions</span>
          </th>
        )}
      </tr>
    </thead>
  );
}