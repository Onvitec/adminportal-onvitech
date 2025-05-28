"use client"

import { forwardRef } from "react";

interface TableCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const TableCheckbox = forwardRef<HTMLInputElement, TableCheckboxProps>(
  ({ checked, onChange, className = "" }, ref) => {
    return (
      <div className={`flex h-5 items-center ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
      </div>
    );
  }
);

TableCheckbox.displayName = "TableCheckbox";

export default TableCheckbox;