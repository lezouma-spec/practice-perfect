import { cn } from "@/lib/utils";
import { PAY_LABEL, type PayStatus } from "@/lib/clinic";

export function PayBadge({ status, label }: { status: PayStatus; label?: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === "paid" && "bg-success-soft text-success",
      status === "partial" && "bg-warning-soft text-warning",
      status === "owing" && "bg-danger-soft text-destructive")}>
      {label ?? PAY_LABEL[status]}
    </span>
  );
}
