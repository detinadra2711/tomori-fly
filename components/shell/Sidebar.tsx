"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Plane,
  Users,
  Eye,
  Ticket,
  Database,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const USER_NAV: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/requests", label: "Pengajuan Saya", icon: ClipboardList },
  { href: "/user/requests/new", label: "Pengajuan Baru", icon: PlusCircle },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard Admin", icon: LayoutDashboard },
  { href: "/admin/users", label: "Manajemen User", icon: Users },
  { href: "/admin/master", label: "Master Data", icon: Database },
];

const OFFICER_NAV: NavItem[] = [
  { href: "/officer/dashboard", label: "Dashboard Officer", icon: LayoutDashboard },
  { href: "/officer/requests", label: "Mengetahui Pengajuan", icon: Eye },
];

const AGENT_NAV: NavItem[] = [
  { href: "/travel-agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/travel-agent/bookings", label: "Booking", icon: Ticket },
];

function navForRole(role: Role): NavItem[] {
  if (role === "admin")
    return [...USER_NAV, ...OFFICER_NAV, ...AGENT_NAV, ...ADMIN_NAV];
  if (role === "officer") return [...USER_NAV, ...OFFICER_NAV];
  // Travel agent adalah pihak eksternal: hanya memesan, tidak mengajukan perjalanan.
  if (role === "travel_agent") return AGENT_NAV;
  return USER_NAV;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/user/requests")
    return pathname === href || /^\/user\/requests\/[^/]+$/.test(pathname);
  if (href === "/admin/users")
    return pathname === href || pathname.startsWith("/admin/users/");
  if (href === "/admin/master")
    return pathname === href || pathname.startsWith("/admin/master/");
  if (href === "/officer/requests")
    return pathname === href || pathname.startsWith("/officer/requests/");
  if (href === "/travel-agent/bookings")
    return pathname === href || pathname.startsWith("/travel-agent/bookings/");
  if (href === "/officer/dashboard" || href === "/admin/dashboard" || href === "/travel-agent/dashboard")
    return pathname === href;
  return pathname === href;
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const nav = navForRole(role);

  return (
    <aside className="hidden w-[76px] flex-col items-center gap-2 py-6 md:flex">
      <span className="mb-6 flex size-11 items-center justify-center rounded-2xl bg-accent-green text-[#0b2415] shadow-card">
        <Plane className="size-5" />
      </span>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {nav.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex size-12 items-center justify-center rounded-2xl transition-colors",
                active
                  ? "bg-panel text-primary shadow-card"
                  : "text-muted hover:bg-white/5 hover:text-primary"
              )}
            >
              <Icon className="size-5" />
              {active ? (
                <span className="absolute -left-2 h-6 w-1 rounded-full bg-accent-green" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const nav = navForRole(role);
  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-[var(--radius-card)] bg-panel/95 p-2 shadow-float backdrop-blur md:hidden">
      {nav.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} className={cn("flex size-11 items-center justify-center rounded-2xl", active ? "bg-accent-green text-[#0b2415]" : "text-muted")} aria-label={item.label}><Icon className="size-5" /></Link>;
      })}
    </nav>
  );
}
