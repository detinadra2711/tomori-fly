import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "aside";
  tone?: "panel" | "detail";
}

/**
 * Big rounded floating surface — the main panel and side/detail panel.
 * Depth comes purely from background contrast + soft shadow (no borders).
 */
export function Panel({
  as: Tag = "div",
  tone = "panel",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-panel)] shadow-panel",
        tone === "panel" ? "bg-panel" : "bg-panel-detail",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
