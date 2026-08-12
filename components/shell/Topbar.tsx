"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/shell/NotificationBell";
import type { Notification, User } from "@/types";

export function Topbar({
  user,
  notifications,
  unreadCount,
}: {
  user: User;
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const hour = new Date().getHours();
  const greet =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        {/* Greeting headline — large, regular weight, casual/warm */}
        <p className="text-sm text-muted">{greet},</p>
        <h1 className="text-[38px] font-normal leading-tight text-primary">
          Hi {user.name}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          role={user.role}
        />

        <div className="flex items-center gap-1 rounded-2xl bg-panel p-1.5 pr-3 shadow-card">
          <Link
            href="/profile"
            title="Profil saya"
            className="flex items-center gap-3 rounded-xl px-1 py-0.5 transition-colors hover:bg-white/5"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent-blue/20 text-sm font-medium text-accent-blue">
              {initials}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-medium text-primary">{user.name}</p>
              <p className="text-[11px] capitalize text-muted">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            className="ml-1 flex size-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-accent-red"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
