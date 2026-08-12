import { getCurrentUser } from "@/lib/supabase/auth";
import type { User } from "@/types";

export class NotAuthorizedError extends Error {
  constructor(message = "Akses ditolak.") {
    super(message);
    this.name = "NotAuthorizedError";
  }
}

/**
 * Pastikan pemanggil adalah admin aktif. Dipakai di setiap server action
 * dan admin layout. Melempar NotAuthorizedError bila tidak memenuhi.
 */
export async function assertAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin" || !user.isActive) {
    throw new NotAuthorizedError();
  }
  return user;
}
