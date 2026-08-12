import { CalendarDays, Hotel, Link2, Plane, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { RequestType } from "@/types";

export interface SegmentDraft {
  airlineName: string;
  flightCode: string;
  originCity: string;
  destCity: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
}

export interface HotelDraft {
  name: string;
  city: string;
  checkin: string;
  checkout: string;
  bedType: string;
  notes: string;
}

export const emptySegment = (): SegmentDraft => ({
  airlineName: "",
  flightCode: "",
  originCity: "",
  destCity: "",
  departureDate: "",
  departureTime: "",
  arrivalTime: "",
});

export const emptyHotel = (): HotelDraft => ({
  name: "",
  city: "",
  checkin: "",
  checkout: "",
  bedType: "TWIN_BED",
  notes: "",
});

export const BED_TYPES = [
  { value: "TWIN_BED", label: "Twin Bed" },
  { value: "QUEEN_BED", label: "Queen Bed" },
  { value: "KING_BED", label: "King Bed" },
];

const REQUEST_TYPES: Array<{ value: RequestType; title: string; subtitle: string; icon: typeof Plane }> = [
  { value: "ON_DUTY", title: "ON DUTY", subtitle: "Perjalanan saat jadwal kerja", icon: Plane },
  { value: "OFF_DUTY", title: "OFF DUTY", subtitle: "Perjalanan di luar jadwal kerja", icon: Plane },
  { value: "DINAS_LUAR", title: "DINAS LUAR", subtitle: "Perjalanan dinas eksternal", icon: Plane },
  { value: "CUTI", title: "CUTI", subtitle: "Pengajuan periode cuti", icon: CalendarDays },
];

export function TypeFields({ value, onChange }: { value: RequestType; onChange: (value: RequestType) => void }) {
  return (
    <FormSection number="01" title="Jenis pengajuan">
      <div className="grid gap-3 sm:grid-cols-2">
        {REQUEST_TYPES.map((item) => <TypeButton key={item.value} active={value === item.value} icon={item.icon} title={item.title} subtitle={item.subtitle} onClick={() => onChange(item.value)} />)}
      </div>
    </FormSection>
  );
}

export function SegmentFields({ segments, onChange, airlines, cities }: { segments: SegmentDraft[]; onChange: (segments: SegmentDraft[]) => void; airlines: string[]; cities: string[] }) {
  const update = (index: number, field: keyof SegmentDraft, value: string) => onChange(segments.map((segment, position) => position === index ? { ...segment, [field]: value } : segment));
  return (
    <FormSection number="02" title="Penerbangan" action={<Button type="button" variant="secondary" size="sm" onClick={() => onChange([...segments, emptySegment()])}><Plus /> Tambah</Button>}>
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div key={index} className="rounded-[var(--radius-card)] bg-card p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-medium">Segmen {index + 1}</p>{segments.length > 1 ? <button type="button" onClick={() => onChange(segments.filter((_, position) => position !== index))} className="text-muted hover:text-accent-red"><Trash2 className="size-4" /></button> : null}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Tanggal keberangkatan" className="md:col-span-2"><Input type="date" value={segment.departureDate} onChange={(event) => update(index, "departureDate", event.target.value)} /></Field>
              <Field label="Maskapai"><Select value={segment.airlineName} onChange={(value) => update(index, "airlineName", value)} options={airlines} placeholder="Pilih maskapai" /></Field>
              <Field label="Kode penerbangan (opsional)"><Input value={segment.flightCode} onChange={(event) => update(index, "flightCode", event.target.value)} placeholder="GA-402" /></Field>
              <Field label="Kota asal"><Select value={segment.originCity} onChange={(value) => update(index, "originCity", value)} options={cities} placeholder="Pilih kota asal" /></Field>
              <Field label="Kota tujuan"><Select value={segment.destCity} onChange={(value) => update(index, "destCity", value)} options={cities} placeholder="Pilih kota tujuan" /></Field>
              <Field label="Jam keberangkatan (Departure)"><Input type="time" value={segment.departureTime} onChange={(event) => update(index, "departureTime", event.target.value)} /></Field>
              <Field label="Jam kedatangan (Arrival)"><Input type="time" value={segment.arrivalTime} onChange={(event) => update(index, "arrivalTime", event.target.value)} /></Field>
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

export function HotelFields({ enabled, hotel, spkrLinks, onEnabled, onHotel, onSpkrLinks }: { enabled: boolean; hotel: HotelDraft; spkrLinks: string[]; onEnabled: (value: boolean) => void; onHotel: (hotel: HotelDraft) => void; onSpkrLinks: (value: string[]) => void }) {
  return (
    <FormSection number="03" title="Hotel & SPKR">
      <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-card p-4">
        <span className="flex items-center gap-3"><Hotel className="size-5 text-accent-orange" /><span><span className="block text-sm font-medium">Butuh hotel</span><span className="block text-xs text-muted">Tambahkan reservasi perjalanan</span></span></span>
        <input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} className="size-5 accent-green-500" />
      </label>
      {enabled ? <div className="mt-3 grid gap-3 rounded-[var(--radius-card)] bg-card p-4 sm:grid-cols-2">
        <Field label="Nama hotel"><Input value={hotel.name} onChange={(event) => onHotel({ ...hotel, name: event.target.value })} placeholder="Nama hotel" /></Field>
        <Field label="Kota"><Input value={hotel.city} onChange={(event) => onHotel({ ...hotel, city: event.target.value })} placeholder="Surabaya" /></Field>
        <Field label="Check-in"><Input type="date" value={hotel.checkin} onChange={(event) => onHotel({ ...hotel, checkin: event.target.value })} /></Field>
        <Field label="Check-out"><Input type="date" value={hotel.checkout} onChange={(event) => onHotel({ ...hotel, checkout: event.target.value })} /></Field>
        <Field label="Tipe bed"><Select value={hotel.bedType} onChange={(bedType) => onHotel({ ...hotel, bedType })} options={BED_TYPES.map((bed) => bed.label)} /></Field>
        <div className="hidden sm:block" />
        <Field label="Notes" className="sm:col-span-2"><textarea value={hotel.notes} onChange={(event) => onHotel({ ...hotel, notes: event.target.value })} rows={2} placeholder="Catatan tambahan untuk hotel (opsional)" className="w-full resize-none rounded-2xl bg-black/25 px-4 py-3 text-sm text-primary ring-1 ring-inset ring-white/10 outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent-blue/60" /></Field>
      </div> : null}
      <div className="mt-4 space-y-3">
        {spkrLinks.map((link, index) => <Field key={index} label={`Link SPKR Google Drive${index ? ` ${index + 1} (opsional)` : ""}`}><div className="flex gap-2"><div className="relative flex-1"><Link2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input type="url" value={link} onChange={(event) => onSpkrLinks(spkrLinks.map((item, position) => position === index ? event.target.value : item))} placeholder="https://drive.google.com/..." className="pl-11" /></div>{index ? <Button type="button" variant="ghost" size="icon" aria-label="Hapus link SPKR" onClick={() => onSpkrLinks(spkrLinks.filter((_, position) => position !== index))}><Trash2 /></Button> : null}</div></Field>)}
        <Button type="button" variant="secondary" size="sm" onClick={() => onSpkrLinks([...spkrLinks, ""])}><Plus /> Tambah link (opsional)</Button>
      </div>
    </FormSection>
  );
}

export function FormSection({ number, title, action, children }: { number: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="mt-8"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-3"><span className="font-mono text-xs text-accent-green">{number}</span><h3 className="text-sm font-medium">{title}</h3></div>{action}</div>{children}</section>;
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("block space-y-1.5", className)}><span className="text-xs font-medium text-muted">{label}</span>{children}</label>;
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (value: string) => void; options: string[]; placeholder?: string }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-2xl bg-black/25 px-4 text-sm text-primary ring-1 ring-inset ring-white/10 outline-none focus:ring-2 focus:ring-accent-blue/60">{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => <option key={option}>{option}</option>)}</select>;
}

function TypeButton({ active, icon: Icon, title, subtitle, onClick }: { active: boolean; icon: typeof Plane; title: string; subtitle: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex items-center gap-4 rounded-[var(--radius-card)] p-4 text-left transition-colors", active ? "bg-panel-detail ring-2 ring-accent-green/60" : "bg-card hover:bg-card-hover")}><span className="flex size-11 items-center justify-center rounded-2xl bg-black/20 text-accent-green"><Icon className="size-5" /></span><span><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-muted">{subtitle}</span></span></button>;
}
