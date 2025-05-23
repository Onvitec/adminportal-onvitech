// TableStatus.tsx
import { CheckCircle2, Clock } from "lucide-react";

interface TableStatusProps {
  status: string;
}

export default function TableStatus({ status }: TableStatusProps) {
  const isCompleted = status.toLowerCase() === "completed";

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${
        isCompleted ? "text-green-600" : "text-gray-600"
      }`}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span className="capitalize">{status}</span>
    </div>
  );
}