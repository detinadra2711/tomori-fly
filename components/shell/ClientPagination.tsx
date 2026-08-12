"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pagination client-side (state di komponen induk) untuk list yang di-fetch client. */
export function ClientPagination({
  page,
  totalPages,
  totalCount,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return <p className="mt-4 text-center text-xs text-muted">{totalCount} item</p>;
  }
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <p className="text-xs text-muted">
        Halaman {page} dari {totalPages} · {totalCount} item
      </p>
      <div className="flex items-center gap-1">
        <Btn disabled={page <= 1} onClick={() => onChange(page - 1)} label="Sebelumnya">
          <ChevronLeft className="size-4" />
        </Btn>
        <span className="px-2 text-xs text-muted">{page}/{totalPages}</span>
        <Btn disabled={page >= totalPages} onClick={() => onChange(page + 1)} label="Berikutnya">
          <ChevronRight className="size-4" />
        </Btn>
      </div>
    </div>
  );
}

function Btn({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-xl bg-card px-2 text-xs font-medium text-muted transition-colors hover:bg-card-hover hover:text-primary",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {children}
    </button>
  );
}
