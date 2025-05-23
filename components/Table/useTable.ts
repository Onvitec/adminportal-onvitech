// useTable.ts
"use client"
import { useState, useMemo } from "react";
import { SortConfig, ColumnDef } from "./types";

export function useTable<T>({
  data = [],
  pageSize = 10,
}: {
  data: T[];
  pageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleSelectRow = (row: T, isSelected: boolean) => {
    setSelectedRows((prev) =>
      isSelected ? [...prev, row] : prev.filter((r) => r !== row)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedRows(isSelected ? [...data] : []);
  };

  return {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    selectedRows,
    handleSelectRow,
    handleSelectAll,
    sortedData,
    requestSort,
    sortConfig,
    totalPages,
  };
}