// Table.tsx
"use client";
import type React from "react";
import { forwardRef } from "react";
import { TableProps } from "./types";
import { useTable } from "./useTable";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TablePagination from "./TablePagination";

function TableInner<T>(
  {
    data = [],
    columns = [],
    onRowSelect,
    onRowClick,
    pageSize = 10,
    pageSizeOptions = [5, 10, 20, 50],
    showCheckbox = true,
    showActions = true,
    isSelectable = false,
    className = "",
    actions,
  }: TableProps<T>,
  ref: React.Ref<HTMLDivElement>
) {
  const {
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
  } = useTable<T>({ data, pageSize });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className={`flex flex-col ${className}`} ref={ref}>
      <div className="overflow-x-auto rounded-lg border border-[#C5D2E799]">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-[#C5D2E799]">
              <TableHeader
                columns={columns}
                showCheckbox={showCheckbox}
                onSelectAll={handleSelectAll}
                requestSort={requestSort}
                sortConfig={sortConfig}
                showActions={showActions}
                allSelected={
                  selectedRows.length === data.length && data.length > 0
                }
              />
              <tbody className="divide-y divide-[#C5D2E799] bg-white">
                {paginatedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    row={row}
                    rowIndex={rowIndex}
                    columns={columns}
                    showCheckbox={showCheckbox}
                    isSelected={selectedRows.includes(row)}
                    onSelect={(isSelected: any) =>
                      handleSelectRow(row, isSelected)
                    }
                    onClick={() => onRowClick?.(row)}
                    isSelectable={isSelectable}
                    showActions={showActions}
                    actions={actions}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={rowsPerPage}
        totalItems={data.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setRowsPerPage}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}

// Assign displayName to the inner component
TableInner.displayName = "Table";

// Forward the ref with proper typing
const Table = forwardRef(TableInner) as <T>(
  props: TableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.JSX.Element;

export default Table;
