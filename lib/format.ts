/** Format tanggal lokal Indonesia dipakai lintas halaman detail. */

export function formatDate(value?: string | null): string {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "-";
}

export function formatDateLong(value?: string | null): string {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(value))
    : "-";
}

export function formatDateTime(value?: string | null): string {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";
}
