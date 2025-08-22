import { toast, Toaster } from "sonner";
import React from "react";

type ToastType = "success" | "error" | "warning" | "info";

export const showToast = (
  type: ToastType,
  message: string,
  options?: {
    duration?: number;
    position?:
      | "top-center"
      | "top-right"
      | "top-left"
      | "bottom-center"
      | "bottom-right"
      | "bottom-left";
  }
) => {
  const baseStyles: React.CSSProperties = {
    fontWeight: 500,
    fontSize: "14px",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    maxWidth: "90vw",
    width: "fit-content",
    overflow: "hidden",
    justifyContent: "center", // ✅ ye text ko center rakhega
  };

  const toastStyles: Record<
    ToastType,
    { backgroundColor: string; color: string; iconColor: string; borderLeft?: string }
  > = {
    success: {
      backgroundColor: "#BAEDD7",
      color: "#242B42",
      iconColor: "#10B981",
    },
    error: {
      backgroundColor: "#FEE2E2",
      color: "#B91C1C",
      borderLeft: "4px solid #DC2626",
      iconColor: "#DC2626",
    },
    warning: {
      backgroundColor: "#FEF3C7",
      color: "#92400E",
      iconColor: "#F59E0B",
    },
    info: {
      backgroundColor: "#DBEAFE",
      color: "#1E40AF",
      iconColor: "#3B82F6",
    },
  };

  const toastOptions = {
    duration: options?.duration || 3000,
    position: options?.position || "top-center", // ✅ container ko center align karne ke liye
    style: {
      ...baseStyles,
      ...toastStyles[type],
    },
    className: "sonner-toast",
  };

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        overflow: "hidden",
        maxWidth: "100%",
        flex: 1,
        justifyContent: "center", // ✅ ensures full center alignment
      }}
    >
      {children}
    </div>
  );

  const TextWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        flex: 1,
        minWidth: 0,
        textAlign: "center", // ✅ text ko center align karega
      }}
    >
      {children}
    </div>
  );

  const toastContent = (
    <ContentWrapper>
      <TextWrapper>{message}</TextWrapper>
    </ContentWrapper>
  );

  switch (type) {
    case "success":
      toast.success(toastContent, toastOptions);
      break;
    case "error":
      toast.error(toastContent, toastOptions);
      break;
    case "warning":
      toast.warning(toastContent, toastOptions);
      break;
    case "info":
      toast.info(toastContent, toastOptions);
      break;
    default:
      toast(toastContent, toastOptions);
  }
};

export const ToastProvider = () => (
  <Toaster richColors position="top-center" /> 
);
