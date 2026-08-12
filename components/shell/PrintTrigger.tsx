"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/** Tombol cetak + auto-print saat halaman print dibuka. */
export function PrintTrigger({ auto = true }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-800 px-5 text-sm font-medium text-white hover:bg-slate-700"
    >
      <Printer className="size-4" /> Cetak / Simpan PDF
    </button>
  );
}
