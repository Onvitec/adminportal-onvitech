"use client";

import { ColumnDef } from "./types";
import TableStatus from "./TableStatus";

interface TableCellProps<T> {
  row: T;
  column: ColumnDef<T>;
  isFirstColumn: boolean;
}

export default function TableCell<T>({
  row,
  column,
  isFirstColumn,
}: TableCellProps<T>) {
  const value = row[column.accessorKey];
  return (
    <td
      className={`whitespace-nowrap px-3 py-4 text-sm text-gray-500 ${
        isFirstColumn ? "pl-6" : ""
      }`}
    >
      {column.cell ? (
        column.cell({ row, getValue: () => value })
      ) : column.accessorKey === "status" ? (
        <TableStatus status={String(value)} />
      ) : (
        <>{String(value)}</>
      )}
    </td>
  );
}
