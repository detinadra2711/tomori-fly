"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, NotAuthorizedError } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  validateEmail,
  validateName,
  validatePassword,
  validateRole,
} from "@/lib/admin/validation";
import type {
  ActionResult,
  CreateAccountInput,
  ResetPasswordInput,
  UpdateAccountInput,
  AdminAction,
} from "@/lib/admin/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fail(error: string, field?: string): { ok: false; error: string; field?: string } {
  return { ok: false, error, field };
}

async function writeAudit(params: {
  actorId: string;
  targetId: string | null;
  action: AdminAction;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("user_admin_audit").insert({
    actor_id: params.actorId,
    target_id: params.targetId,
    action: params.action,
    details: params.details ?? {},
  });
}

async function activeAdminCount(excludeId?: string): Promise<number> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count } = await query;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// createAccount
// ---------------------------------------------------------------------------

export async function createAccount(
  input: CreateAccountInput
): Promise<ActionResult<{ id: string }>> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch {
    return fail("Akses ditolak.");
  }

  const nameErr = validateName(input.name);
  if (nameErr) return fail(nameErr.message, nameErr.field);
  const emailErr = validateEmail(input.email);
  if (emailErr) return fail(emailErr.message, emailErr.field);
  const roleErr = validateRole(input.role);
  if (roleErr) return fail(roleErr.message, roleErr.field);

  const email = input.email.trim().toLowerCase();
  const metadata = {
    name: input.name.trim(),
    role: input.role,
    department: input.department?.trim() || null,
  };

  const admin = createAdminClient();

  let userId: string;
  if (input.provisioning.mode === "password") {
    const pwErr = validatePassword(input.provisioning.password);
    if (pwErr) return fail(pwErr.message, pwErr.field);

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.provisioning.password,
      email_confirm: true,
      user_metadata: {
        ...metadata,
        require_password_change: Boolean(input.provisioning.requireChange),
      },
    });
    if (error || !data.user) return fail(mapAuthError(error?.message), "email");
    userId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
    if (error || !data.user) return fail(mapAuthError(error?.message), "email");
    userId = data.user.id;
  }

  // Pastikan profil ada (trigger handle_new_user biasanya sudah membuatnya).
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      name: metadata.name,
      email,
      role: input.role,
      department: metadata.department,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    // Kompensasi: hapus auth user agar tidak ada record yatim (BR-5).
    await admin.auth.admin.deleteUser(userId);
    return fail("Gagal membuat profil akun. Coba lagi.");
  }

  await writeAudit({
    actorId: actor.id,
    targetId: userId,
    action: "CREATE",
    details: { after: { email, role: input.role, department: metadata.department } },
  });

  revalidatePath("/admin/users");
  return { ok: true, data: { id: userId } };
}

// ---------------------------------------------------------------------------
// updateAccount
// ---------------------------------------------------------------------------

export async function updateAccount(
  input: UpdateAccountInput
): Promise<ActionResult> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch {
    return fail("Akses ditolak.");
  }

  const admin = createAdminClient();
  const { data: currentRow } = await admin
    .from("profiles")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (!currentRow) return fail("Akun tidak ditemukan.");

  const isSelf = input.id === actor.id;

  // BR-1: admin tidak boleh mengubah role diri sendiri.
  if (input.role && input.role !== currentRow.role && isSelf) {
    return fail("Anda tidak dapat mengubah peran akun sendiri.", "role");
  }

  // BR-2: cegah menurunkan admin aktif terakhir.
  if (
    input.role &&
    input.role !== "admin" &&
    currentRow.role === "admin" &&
    currentRow.is_active
  ) {
    if ((await activeAdminCount(input.id)) === 0) {
      return fail("Tidak dapat menurunkan admin aktif terakhir.", "role");
    }
  }

  if (input.name !== undefined) {
    const nameErr = validateName(input.name);
    if (nameErr) return fail(nameErr.message, nameErr.field);
  }

  const newEmail = input.email?.trim().toLowerCase();
  if (newEmail && newEmail !== currentRow.email) {
    const emailErr = validateEmail(newEmail);
    if (emailErr) return fail(emailErr.message, emailErr.field);
    const { error } = await admin.auth.admin.updateUserById(input.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (error) return fail(mapAuthError(error.message), "email");
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.department !== undefined)
    patch.department = input.department?.trim() || null;
  if (newEmail) patch.email = newEmail;
  if (input.role) patch.role = input.role;

  if (Object.keys(patch).length) {
    const { error } = await admin.from("profiles").update(patch).eq("id", input.id);
    if (error) return fail("Gagal menyimpan perubahan.");
  }

  await writeAudit({
    actorId: actor.id,
    targetId: input.id,
    action: input.role && input.role !== currentRow.role ? "ROLE_CHANGE" : "UPDATE",
    details: {
      before: { role: currentRow.role, email: currentRow.email },
      after: patch,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${input.id}`);
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// setAccountActive
// ---------------------------------------------------------------------------

export async function setAccountActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch {
    return fail("Akses ditolak.");
  }

  if (id === actor.id && !isActive) {
    return fail("Anda tidak dapat menonaktifkan akun sendiri.");
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Akun tidak ditemukan.");

  // BR-2: cegah menonaktifkan admin aktif terakhir.
  if (!isActive && row.role === "admin" && row.is_active) {
    if ((await activeAdminCount(id)) === 0) {
      return fail("Tidak dapat menonaktifkan admin aktif terakhir.");
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return fail("Gagal memperbarui status akun.");

  // Best-effort: revoke sesi aktif saat dinonaktifkan.
  if (!isActive) {
    try {
      await admin.auth.admin.signOut(id);
    } catch {
      // abaikan bila tidak didukung
    }
  }

  await writeAudit({
    actorId: actor.id,
    targetId: id,
    action: isActive ? "ACTIVATE" : "DEACTIVATE",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { ok: true, data: undefined };
}


// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult> {
  let actor;
  try {
    actor = await assertAdmin();
  } catch {
    return fail("Akses ditolak.");
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.id)
    .maybeSingle();
  if (!row) return fail("Akun tidak ditemukan.");

  if (input.mode === "temporary") {
    const pwErr = validatePassword(input.password);
    if (pwErr) return fail(pwErr.message, pwErr.field);
    const { error } = await admin.auth.admin.updateUserById(input.id, {
      password: input.password,
      user_metadata: { require_password_change: Boolean(input.requireChange) },
    });
    if (error) return fail("Gagal mengatur password baru.");
  } else {
    // Kirim email reset via server client biasa.
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(row.email);
    if (error) return fail("Gagal mengirim email reset.");
  }

  await writeAudit({
    actorId: actor.id,
    targetId: input.id,
    action: "PASSWORD_RESET",
    details: { mode: input.mode },
  });

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

function mapAuthError(message?: string): string {
  if (!message) return "Terjadi kesalahan.";
  const lower = message.toLowerCase();
  if (lower.includes("already") && lower.includes("registered"))
    return "Email sudah terdaftar.";
  if (lower.includes("email") && lower.includes("exists"))
    return "Email sudah terdaftar.";
  return message;
}

export { NotAuthorizedError };
