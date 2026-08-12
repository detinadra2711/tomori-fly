"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAirline,
  createCity,
  deleteAirline,
  deleteCity,
  setAirlineActive,
  setCityActive,
} from "@/app/(dashboard)/admin/master-actions";
import type { Airline, City } from "@/types";

export function MasterDataManager({
  airlines,
  cities,
}: {
  airlines: Airline[];
  cities: City[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <AirlinesPanel airlines={airlines} />
      <CitiesPanel cities={cities} />
    </div>
  );
}

function AirlinesPanel({ airlines }: { airlines: Airline[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const result = await createAirline(name, code);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setName("");
    setCode("");
    router.refresh();
  }

  return (
    <Panel className="p-5 sm:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-accent-blue">Master data</p>
        <h2 className="mt-1 text-xl font-normal">Maskapai</h2>
        <p className="mt-1 text-sm text-muted">Kelola daftar maskapai pada form pengajuan.</p>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_110px_auto]">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama maskapai" />
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode" />
        <Button type="button" disabled={busy || !name.trim()} onClick={add}><Plus /> Tambah</Button>
      </div>
      {error ? <p className="mt-2 text-xs text-accent-red">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {airlines.map((a) => (
          <Row
            key={a.id}
            title={a.name}
            subtitle={a.code ?? undefined}
            isActive={a.isActive}
            onToggle={async () => { await setAirlineActive(a.id, !a.isActive); router.refresh(); }}
            onDelete={async () => { await deleteAirline(a.id); router.refresh(); }}
          />
        ))}
        {!airlines.length ? <Empty /> : null}
      </div>
    </Panel>
  );
}

function CitiesPanel({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const result = await createCity(name);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setName("");
    router.refresh();
  }

  return (
    <Panel className="p-5 sm:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-accent-orange">Master data</p>
        <h2 className="mt-1 text-xl font-normal">Kota</h2>
        <p className="mt-1 text-sm text-muted">Kelola daftar kota asal/tujuan penerbangan.</p>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kota, mis. Jakarta (CGK)" />
        <Button type="button" disabled={busy || !name.trim()} onClick={add}><Plus /> Tambah</Button>
      </div>
      {error ? <p className="mt-2 text-xs text-accent-red">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {cities.map((c) => (
          <Row
            key={c.id}
            title={c.name}
            isActive={c.isActive}
            onToggle={async () => { await setCityActive(c.id, !c.isActive); router.refresh(); }}
            onDelete={async () => { await deleteCity(c.id); router.refresh(); }}
          />
        ))}
        {!cities.length ? <Empty /> : null}
      </div>
    </Panel>
  );
}

function Row({
  title,
  subtitle,
  isActive,
  onToggle,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-card)] bg-card p-3 shadow-card">
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary">{title}</span>
        {subtitle ? <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] text-muted">{subtitle}</span> : null}
        {isActive ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-accent-green"><Check className="size-3" /> aktif</span>
        ) : (
          <span className="text-[11px] text-muted">nonaktif</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onToggle} title={isActive ? "Nonaktifkan" : "Aktifkan"} className="flex size-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-primary">
          {isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
        </button>
        <button type="button" onClick={onDelete} title="Hapus" className="flex size-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-accent-red">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Empty() {
  return <div className="rounded-[var(--radius-card)] bg-black/15 px-6 py-10 text-center text-sm text-muted">Belum ada data.</div>;
}
