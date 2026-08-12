"use client";

import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

/**
 * Floating quick-action widget — sits detached above the main panel to create
 * the layered/depth feel of the mockup's music player.
 */
export function FloatingWidget() {
  return (
    <div className="w-full rounded-[var(--radius-card)] bg-panel-detail p-4 shadow-float">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Sparkles className="size-3.5 text-accent-orange" />
        Aksi cepat
      </div>
      <p className="mt-2 text-sm text-primary">
        Butuh perjalanan baru? Ajukan tiket &amp; hotel dalam satu form.
      </p>
      <Link
        href="/user/requests/new"
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-accent-green text-sm font-medium text-[#0b2415] shadow-card transition-all hover:brightness-110"
      >
        <Plus className="size-4" />
        Buat Pengajuan
      </Link>
    </div>
  );
}
