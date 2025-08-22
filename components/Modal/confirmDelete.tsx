import React from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "../Loader";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onCancel}
      ></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-lg w-full max-w-md p-6 z-50">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Loader size="sm" /> : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
