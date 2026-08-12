"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Tombol export CSV dengan popover filter rentang tanggal (created_at).
 * Menghasilkan URL ke `endpoint` dengan param q, from, to.
 */
export function ExportButton({
  endpoint,
  query = "",
}: {
  endpoint: string;
  query?: string;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function buildUrl(withRange: boolean): string {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (withRange && from) params.set("from", from);
    if (withRange && to) params.set("to", to);
    const qs = params.toString();
    return qs ? `${endpoint}?${qs}` : endpoint;
  }

  function download(withRange: boolean) {
    if (withRange && from && to && to < from) {
      setError("Tanggal akhir tidak boleh sebelum tanggal awal.");
      return;
    }
    setError(null);
    window.location.href = buildUrl(withRange);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-card px-4 text-sm text-muted transition-colors hover:bg-card-hover hover:text-primary"
      >
        <Download className="size-4" /> Export CSV
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,300px)] rounded-[var(--radius-card)] bg-panel p-4 shadow-float">
          <p className="text-sm font-medium text-primary">Rentang tanggal</p>
          <p className="mt-1 text-[11px] text-muted">
            Berdasarkan tanggal dibuat. Kosongkan untuk seluruh data.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] text-muted">Dari</span>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-muted">Sampai</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          {error ? <p className="mt-2 text-[11px] text-accent-red">{error}</p> : null}
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => download(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-accent-green text-xs font-medium text-[#0b2415] hover:brightness-110"
            >
              <Download className="size-3.5" /> Export sesuai rentang
            </button>
            <button
              type="button"
              onClick={() => download(false)}
              className="text-[11px] text-muted transition-colors hover:text-primary"
            >
              Export seluruh data
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
