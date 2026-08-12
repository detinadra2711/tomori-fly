"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Search server-driven: mengubah query param `q` (dan reset `page`), lalu
 * navigasi. Debounce 400ms agar tidak spam server. `basePath` tanpa query.
 */
export function SearchBar({
  basePath,
  initialQuery = "",
  placeholder = "Cari...",
}: {
  basePath: string;
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const first = useRef(true);

  useEffect(() => {
    // Jangan navigasi pada mount pertama.
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 400);
    return () => clearTimeout(timer);
  }, [value, basePath, router]);

  return (
    <label className="relative block">
      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-11 pr-10"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Hapus pencarian"
          className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-primary"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </label>
  );
}
