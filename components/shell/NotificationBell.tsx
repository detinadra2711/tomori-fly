"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/(dashboard)/notifications-actions";
import { cn } from "@/lib/utils";
import type { Notification, Role } from "@/types";

const TARGET_BY_ROLE: Record<Role, (tripId: string) => string> = {
  user: (id) => `/user/requests/${id}`,
  admin: (id) => `/user/requests/${id}`,
  officer: (id) => `/officer/requests/${id}`,
  travel_agent: (id) => `/travel-agent/bookings/${id}`,
};

export function NotificationBell({
  notifications,
  unreadCount,
  role,
}: {
  notifications: Notification[];
  unreadCount: number;
  role: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar area.
  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function openItem(item: Notification) {
    setOpen(false);
    if (!item.isRead) await markNotificationRead(item.id);
    if (item.tripRequestId) {
      router.push(TARGET_BY_ROLE[role](item.tripRequestId));
    }
    router.refresh();
  }

  async function readAll() {
    await markAllNotificationsRead();
    router.refresh();
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        title="Notifikasi"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-11 items-center justify-center rounded-2xl bg-panel text-muted shadow-card transition-colors hover:text-primary"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent-orange px-1.5 text-[10px] font-medium text-[#2A2D35]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-[var(--radius-card)] bg-panel shadow-float">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-medium text-primary">Notifikasi</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={readAll}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-primary"
              >
                <CheckCheck className="size-3.5" /> Tandai semua dibaca
              </button>
            ) : null}
          </div>

          <div className="max-h-[60vh] overflow-y-auto pb-2">
            {notifications.length ? (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-white/5",
                    !item.isRead && "bg-white/[0.04]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {!item.isRead ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-accent-orange" />
                    ) : null}
                    <span className="text-xs font-medium text-primary">
                      {item.title}
                    </span>
                  </span>
                  <span className="text-[11px] leading-relaxed text-muted">
                    {item.message}
                  </span>
                  <span className="text-[10px] text-muted/70">
                    {formatRelative(item.createdAt)}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-10 text-center text-xs text-muted">
                Belum ada notifikasi.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
