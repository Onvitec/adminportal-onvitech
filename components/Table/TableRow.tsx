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
}: any) {
  // No need for hover state anymore since actions are always visible
  // const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const defaultActions = [
    {
      label: "View Session",
      icon: <Eye className="h-4 w-4" />,
      action: () => router.push(`sessions/${row.id}`),
    },
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      action: () => router.push(`sessions/edit/${row.id}`),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      action: () => console.log("Delete", row),
      variant: "outline" as const,
    },
    {
      label: "Share Session",
      icon: <Share className="h-4 w-4" />,
      action: () =>
        navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_FRONTEND_URL}/sessions/embed/${row.id}`
        ),
      variant: "outline" as const,
    },
  ];
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

      {showActions && (
        <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
          {/* Always show actions, so pass isVisible={true} */}
          <TableActions actions={defaultActions} isVisible={true} />
        </td>
      )}
    </tr>
  );
}
