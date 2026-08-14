import type { Role } from "@/types";

/** Role yang menampilkan & memakai Kode GFF/Cabin Crew (User & Admin). */
export function showsTravelCodes(role: Role): boolean {
  return role === "user" || role === "admin";
}

/** Role yang WAJIB mengisi Kode GFF/Cabin Crew (hanya User). */
export function requiresTravelCodes(role: Role): boolean {
  return role === "user";
}
