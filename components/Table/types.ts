// types.ts
export type SortDirection = "ascending" | "descending";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  accessorKey: keyof T;
  header: string;
  size?: number;
  enableSorting?: boolean;
  cell?: (props: { row: T; getValue: () => any }) => React.ReactNode;
}


export interface TableAction<T> {
  label: string;
  icon: React.ReactNode;
  action: (row: T) => void;
  variant?: "default" | "destructive" | "outline";
}
export interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  showCheckbox?: boolean;
  showActions?: boolean;
  isSelectable?: boolean;
  className?: string;
  actions?: TableAction<T>[]; 
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}