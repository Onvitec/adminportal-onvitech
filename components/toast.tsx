import { toast } from "sonner";

type ToastType = "success" | "error" | "warning" | "info";

export const showToast = (
  type: ToastType,
  message: string,
  options?: {
    duration?: number;
    position?: "top-center" | "top-right" | "top-left" | "bottom-center" | "bottom-right" | "bottom-left";
  }
) => {
  const baseStyles = {
    fontWeight: 500,
    fontSize: "14px",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    display: "flex", // Use flex for full layout control
    alignItems: "center",
    gap: "12px",
    maxWidth: "90vw",
    width: "fit-content", // Shrink to fit content
    overflow: "hidden", // Prevent child overflow
  };

  const toastStyles = {
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
    position: options?.position || "top-center",
    style: {
      ...baseStyles,
      ...toastStyles[type],
    },
    className: "sonner-toast",
  };

  const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      overflow: "hidden",
      maxWidth: "100%",
      flex: 1,
    }}>
      {children}
    </div>
  );

  const TextWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      flex: 1,
      minWidth: 0,
    }}>
      {children}
    </div>
  );

  const IconWrapper = ({ children, color }: { children: React.ReactNode; color: string }) => (
    <div style={{ 
      color, 
      width: "20px", 
      height: "20px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      flexShrink: 0,
    }}>
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
