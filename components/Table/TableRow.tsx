"use client";
import { useState } from "react";
import TableCell from "./TableCell";
import TableCheckbox from "./TableCheckbox";
import TableActions from "./TableActions";
import { ColumnDef } from "./types";
import { Eye, Pencil, Share, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TableRowProps<T> {
  row: T;
  rowIndex: number;
  columns: ColumnDef<T>[];
  showCheckbox: boolean;
  isSelected: boolean;
  onSelect: (isSelected: boolean) => void;
  onClick?: () => void;
  isSelectable: boolean;
  showActions: boolean;
  actions?: {
    label: string;
    icon: React.ReactNode;
    action: (row: T) => void;
    variant?: "default" | "destructive" | "outline";
  }[];
}

export default function TableRow({
  row,
  rowIndex,
  columns,
  showCheckbox,
  isSelected,
  onSelect,
  onClick,
  isSelectable,
  showActions,
  actions,
}: TableRowProps<any>) {
  return (
    <tr
      key={rowIndex}
      className={`${isSelected ? "bg-gray-50" : ""} ${
        isSelectable ? "cursor-pointer hover:bg-gray-50" : ""
      }`}
      // Remove hover handlers since not needed
      // onMouseEnter={() => setIsHovered(true)}
      // onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {showCheckbox && (
        <td className="relative w-12 px-6 sm:w-16 sm:px-8">
          <TableCheckbox
            checked={isSelected}
            onChange={(checked) => onSelect(checked)}
            className="absolute left-4 top-1/2 -translate-y-1/2"
          />
        </td>
      )}

      {columns.map((column: any, colIndex: any) => (
        <TableCell
          key={column.accessorKey as string}
          row={row}
          column={column}
          isFirstColumn={colIndex === 0 && !showCheckbox}
        />
      ))}

       {showActions && actions && (
        <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
          <TableActions 
            actions={actions.map(action => ({
              ...action,
              action: () => action.action(row)
            }))} 
            isVisible={true} 
          />
        </td>
      )}
    </tr>
  );
}
