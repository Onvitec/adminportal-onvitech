"use client";
import React, { memo, useEffect } from "react";
import { forwardRef } from "react";
import { TableProps } from "./types";
import { useTable } from "./useTable";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TablePagination from "./TablePagination";
import { Loader } from "../Loader";

function TableInner<T extends { id: string | number }>(
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
    isLoading = false,
    onSelectionChange,
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

  // 🔄 Notify parent when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [selectedRows, onSelectionChange]);

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
                {isLoading ? (
                  // 🔄 Loading State
                  <tr>
                    <td
                      colSpan={
                        columns.length +
                        (showCheckbox ? 1 : 0) +
                        (showActions ? 1 : 0)
                      }
                      className="py-8 text-center"
                    >
                      <div className="flex justify-center">
                        <div className="">
                          <Loader size="sm"/>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        columns.length +
                        (showCheckbox ? 1 : 0) +
                        (showActions ? 1 : 0)
                      }
                      className="py-8 text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  // Inside the TableInner component's return statement:
paginatedData.map((row, rowIndex) => (
  <TableRow
    key={row.id ?? rowIndex}
    row={row}
    rowIndex={rowIndex}
    columns={columns}
    showCheckbox={showCheckbox}
    isSelected={selectedRows.includes(row)}
    onSelect={(isSelected: boolean) => {
      handleSelectRow(row, isSelected);
      onRowSelect?.(row as any);
    }}
    isSelectable={isSelectable}
    showActions={showActions}
    actions={actions}
  />
))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!isLoading && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={rowsPerPage}
          totalItems={data.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setRowsPerPage}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}

TableInner.displayName = "Table";

// 🔁 Forward ref with typing
const Table = forwardRef(TableInner) as <T extends { id: string | number }>(
  props: TableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.JSX.Element;

export default Table;
