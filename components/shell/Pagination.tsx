import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pagination server-side berbasis query param ?page=.
 * `basePath` menyertakan query string lain bila ada (mis. "/admin/users?q=foo&").
 */
export function Pagination({
  page,
  totalPages,
  totalCount,
  makeHref,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-center text-xs text-muted">{totalCount} item</p>
    );
  }

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const pages = pageWindow(page, totalPages);

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <p className="text-xs text-muted">
        Halaman {page} dari {totalPages} · {totalCount} item
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={makeHref(prev)} disabled={page <= 1} aria-label="Sebelumnya">
          <ChevronLeft className="size-4" />
        </PageLink>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-xs text-muted">
              …
            </span>
          ) : (
            <PageLink key={p} href={makeHref(p)} active={p === page}>
              {p}
            </PageLink>
          )
        )}
        <PageLink href={makeHref(next)} disabled={page >= totalPages} aria-label="Berikutnya">
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const className = cn(
    "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-medium transition-colors",
    active ? "bg-accent-green text-[#0b2415]" : "bg-card text-muted hover:bg-card-hover hover:text-primary",
    disabled && "pointer-events-none opacity-40"
  );
  if (disabled) {
    return (
      <span className={className} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

/** Build a compact page window like 1 … 4 5 6 … 12. */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}
