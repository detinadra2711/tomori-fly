"use client";

import { Eye, EyeOff } from "lucide-react";

export function PasswordVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
      aria-pressed={visible}
      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}
