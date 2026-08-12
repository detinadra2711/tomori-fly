import type { Role } from "@/types";

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string | null;
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export type Provisioning =
  | { mode: "password"; password: string; requireChange?: boolean }
  | { mode: "invite" };

export interface CreateAccountInput {
  name: string;
  email: string;
  role: Role;
  department?: string;
  provisioning: Provisioning;
}

export interface UpdateAccountInput {
  id: string;
  name?: string;
  department?: string | null;
  email?: string;
  role?: Role;
}

export type ResetPasswordInput =
  | { id: string; mode: "email" }
  | { id: string; mode: "temporary"; password: string; requireChange?: boolean };

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  user: "User",
  officer: "Officer",
  travel_agent: "Travel Agent",
};

export const ALL_ROLES: Role[] = ["admin", "user", "officer", "travel_agent"];

export type AdminAction =
  | "CREATE"
  | "UPDATE"
  | "ROLE_CHANGE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "PASSWORD_RESET";
