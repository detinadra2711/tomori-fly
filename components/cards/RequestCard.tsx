"use client";

import { Plane, Hotel, CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status/StatusBadge";
import type { TripRequest } from "@/types";

interface RequestCardProps {
  trip: TripRequest;
  active?: boolean;
  onSelect?: (trip: TripRequest) => void;
}

/**
 * Uniform "device card" analog — one trip request per card.
 * Icon + title + sub-info + status, with a small action button bottom-right.
 */
export function RequestCard({ trip, active, onSelect }: RequestCardProps) {
  const isDinas = trip.tripType !== "CUTI";
  const subInfo = isDinas
    ? `${trip.segments.length} penerbangan${trip.needHotel ? " + hotel" : ""}`
    : `${trip.leaveStart ?? "-"} → ${trip.leaveEnd ?? "-"}`;

  const Icon = isDinas ? Plane : CalendarDays;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(trip)}
      className={cn(
        "group relative flex h-[132px] w-full flex-col justify-between rounded-[var(--radius-card)] p-4 text-left transition-all shadow-card",
        active
          ? "bg-card-hover ring-2 ring-accent-green/60"
          : "bg-card hover:bg-card-hover"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-xl bg-black/25 text-accent-blue">
          <Icon className="size-4" />
        </span>
        <StatusBadge status={trip.status} />
      </div>

      <div>
        <p className="truncate text-sm font-medium text-primary">
          {trip.purpose}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
          <span className="font-mono">{trip.code}</span>
          <span className="opacity-40">•</span>
          {isDinas && trip.needHotel ? (
            <Hotel className="size-3" />
          ) : null}
          <span className="truncate">{subInfo}</span>
        </p>
      </div>

      <span
        className={cn(
          "absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-full bg-black/25 text-muted transition-colors",
          "group-hover:bg-accent-green group-hover:text-[#0b2415]"
        )}
      >
        <ChevronRight className="size-4" />
      </span>
    </button>
  );
}
