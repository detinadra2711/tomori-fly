import type { Role } from "@/types";
import { ALL_ROLES } from "@/lib/admin/types";

export interface FieldError {
  field: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): FieldError | null {
  if (!email.trim()) return { field: "email", message: "Email wajib diisi." };
  if (!EMAIL_RE.test(email.trim()))
    return { field: "email", message: "Format email tidak valid." };
  return null;
}

export function validateName(name: string): FieldError | null {
  if (!name.trim()) return { field: "name", message: "Nama wajib diisi." };
  if (name.trim().length < 2)
    return { field: "name", message: "Nama minimal 2 karakter." };
  return null;
}

export function validateRole(role: string): FieldError | null {
  if (!ALL_ROLES.includes(role as Role))
    return { field: "role", message: "Peran tidak valid." };
  return null;
}

/**
 * Password strength: minimal 8 karakter, mengandung huruf dan angka.
 */
export function validatePassword(password: string): FieldError | null {
  if (!password) return { field: "password", message: "Password wajib diisi." };
  if (password.length < 8)
    return { field: "password", message: "Password minimal 8 karakter." };
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return {
      field: "password",
      message: "Password harus mengandung huruf dan angka.",
    };
  return null;
}
