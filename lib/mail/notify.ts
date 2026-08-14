import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail/mailer";
import {
  accountActivation,
  passwordChanged,
  passwordResetByAdmin,
  tripStatusChanged,
  type TripStatusEmail,
} from "@/lib/mail/templates";

/**
 * Helper notifikasi email (best-effort, tidak pernah melempar error).
 * Dipanggil dari server actions setelah aksi utama berhasil.
 */

interface Recipient {
  name: string;
  email: string;
}

async function getRecipient(userId: string): Promise<Recipient | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("name, email")
      .eq("id", userId)
      .maybeSingle();
    if (!data?.email) return null;
    return { name: data.name ?? "Pengguna", email: data.email };
  } catch {
    return null;
  }
}

/** Email ke pemohon saat status pengajuan berubah. */
export async function notifyTripStatusChange(params: {
  applicantId: string;
  code: string;
  status: TripStatusEmail;
  note?: string;
}): Promise<void> {
  const to = await getRecipient(params.applicantId);
  if (!to) return;
  const mail = tripStatusChanged({
    name: to.name,
    code: params.code,
    status: params.status,
    note: params.note,
  });
  await sendMail({ to: to.email, ...mail });
}

/** Email konfirmasi saat user mengganti password sendiri. */
export async function notifyPasswordChanged(userId: string): Promise<void> {
  const to = await getRecipient(userId);
  if (!to) return;
  const mail = passwordChanged({ name: to.name });
  await sendMail({ to: to.email, ...mail });
}

/** Email pemberitahuan saat admin mereset password (mode temporary). */
export async function notifyPasswordResetByAdmin(userId: string): Promise<void> {
  const to = await getRecipient(userId);
  if (!to) return;
  const mail = passwordResetByAdmin({ name: to.name });
  await sendMail({ to: to.email, ...mail });
}

/** Email pemberitahuan saat akun diaktifkan/dinonaktifkan. */
export async function notifyAccountActivation(
  userId: string,
  active: boolean
): Promise<void> {
  const to = await getRecipient(userId);
  if (!to) return;
  const mail = accountActivation({ name: to.name, active });
  await sendMail({ to: to.email, ...mail });
}
