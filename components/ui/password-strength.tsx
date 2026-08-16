"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const COMMON =
  /^(?:password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|123456)/i;
const RUN = /(.)\1{3,}/;
const RUN_UP =
  /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwer|wert|erty|asdf)/i;
const SYMBOL = /[!-/:-@[-`{-~]/;

const RULES = [
  { id: "length", label: "Minimal 8 karakter", test: (value: string) => value.length >= 8 },
  {
    id: "case",
    label: "Huruf besar dan kecil",
    test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { id: "digit", label: "Satu angka", test: (value: string) => /\d/.test(value) },
  { id: "symbol", label: "Satu simbol", test: (value: string) => SYMBOL.test(value) },
] as const;

const LABELS = ["Kosong", "Lemah", "Cukup", "Baik", "Kuat"] as const;

function evaluatePassword(value: string) {
  const rules = RULES.map((rule) => ({ ...rule, met: rule.test(value) }));
  const passed = rules.filter((rule) => rule.met).length;
  const guessable =
    value.length > 0 && (COMMON.test(value) || RUN.test(value) || RUN_UP.test(value));
  const score = value.length === 0 ? 0 : guessable ? 1 : Math.max(1, passed);

  return { rules, score, guessable };
}

export function PasswordStrength({ value, className }: { value: string; className?: string }) {
  const { rules, score, guessable } = useMemo(() => evaluatePassword(value), [value]);
  const [announcement, setAnnouncement] = useState("");
  const label = LABELS[score] ?? LABELS[LABELS.length - 1];
  const announcementMessage = useMemo(() => {
    if (!value) return "";
    const unmet = rules.filter((rule) => !rule.met).map((rule) => rule.label.toLowerCase());
    return [
      `Kekuatan password ${label.toLowerCase()}.`,
      guessable ? "Password ini mudah ditebak." : "",
      unmet.length ? `Masih diperlukan: ${unmet.join(", ")}.` : "Semua ketentuan terpenuhi.",
    ]
      .filter(Boolean)
      .join(" ");
  }, [guessable, label, rules, value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnnouncement(announcementMessage), value ? 700 : 0);
    return () => window.clearTimeout(timeout);
  }, [announcementMessage, value]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="meter"
        aria-label="Kekuatan password"
        aria-valuemin={0}
        aria-valuemax={RULES.length}
        aria-valuenow={score}
        aria-valuetext={label}
        className="grid grid-cols-4 gap-1.5"
      >
        {rules.map((rule, index) => (
          <span
            key={rule.id}
            className={cn(
              "h-1.5 rounded-full transition-colors duration-200",
              index < score
                ? score <= 1
                  ? "bg-accent-red"
                  : score <= 2
                    ? "bg-accent-orange"
                    : "bg-accent-green"
                : "bg-white/15"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span
          className={cn(
            score <= 1
              ? "text-accent-red"
              : score <= 2
                ? "text-accent-orange"
                : "text-accent-green"
          )}
        >
          {label}
        </span>
        {guessable ? <span className="text-accent-orange">Mudah ditebak</span> : null}
      </div>
      <ul className="space-y-1 text-xs text-muted">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-3.5 items-center justify-center rounded border text-[10px]",
                rule.met
                  ? "border-accent-green bg-accent-green text-[#0b2415]"
                  : "border-white/15"
              )}
            >
              {rule.met ? "✓" : ""}
            </span>
            <span className={rule.met ? "text-primary" : undefined}>{rule.label}</span>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

export default PasswordStrength;
