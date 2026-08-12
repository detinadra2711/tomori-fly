import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full rounded-2xl bg-black/25 px-4 text-sm text-primary placeholder:text-muted/70",
        "ring-1 ring-inset ring-white/10 transition-shadow",
        "focus:outline-none focus:ring-2 focus:ring-accent-blue/60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
