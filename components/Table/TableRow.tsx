"use client";
import { useRouter } from "next/navigation";
import TableCell from "./TableCell";
import TableCheckbox from "./TableCheckbox";
import TableActions from "./TableActions";
import { ColumnDef } from "./types";

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
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on checkbox or actions
    const target = e.target as HTMLElement;
    if (
      target.closest('input[type="checkbox"]') || 
      target.closest('.table-actions')
    ) {
      return;
    }
    
    onClick?.(); // Call the original onClick if it exists
    router.push(`/sessions/${row.id}`); // Navigate to session view page
  };

  return (
    <tr
      key={rowIndex}
      className={`${isSelected ? "bg-gray-50" : ""} ${
        isSelectable ? "cursor-pointer hover:bg-gray-100" : ""
      } transition-colors duration-100`} // Added smooth transition
      onClick={handleRowClick}
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
        <td 
          className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium table-actions"
          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
        >
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