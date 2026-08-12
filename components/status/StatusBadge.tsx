import { cn } from "@/lib/utils";
import type { TripStatus } from "@/types";

const STATUS_MAP: Record<
  TripStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  DRAFT: {
    label: "Draft",
    dot: "bg-accent-blue",
    text: "text-accent-blue",
    bg: "bg-accent-blue/12",
  },
  PENDING: {
    label: "Menunggu",
    dot: "bg-accent-orange",
    text: "text-accent-orange",
    bg: "bg-accent-orange/12",
  },
  ACKNOWLEDGED: {
    label: "Diketahui",
    dot: "bg-accent-green",
    text: "text-accent-green",
    bg: "bg-accent-green/12",
  },
  BOOKED: {
    label: "Terbooking",
    dot: "bg-accent-green",
    text: "text-[#0b2415]",
    bg: "bg-accent-green",
  },
  REJECTED: {
    label: "Dikembalikan",
    dot: "bg-accent-red",
    text: "text-accent-red",
    bg: "bg-accent-red/12",
  },
  CANCELLED: {
    label: "Dibatalkan",
    dot: "bg-muted",
    text: "text-muted",
    bg: "bg-white/5",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TripStatus;
  className?: string;
}) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export { STATUS_MAP };
