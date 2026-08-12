import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "green" | "orange" | "blue" | "neutral";
  className?: string;
}

const ACCENT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  green: "text-accent-green",
  orange: "text-accent-orange",
  blue: "text-accent-blue",
  neutral: "text-primary",
};

/**
 * Card with an oversized thin focal number — mirrors the "19°C" focal element.
 */
export function StatCard({
  label,
  value,
  hint,
  accent = "neutral",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[var(--radius-card)] bg-card p-5 shadow-card",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-4 text-6xl font-thin leading-none tracking-tight",
          ACCENT[accent]
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
