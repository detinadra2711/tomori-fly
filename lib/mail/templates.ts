/**
 * Template email transaksional (Bahasa Indonesia).
 * Semua template mengembalikan { subject, html, text }.
 */

export interface MailContent {
  subject: string;
  html: string;
  text: string;
}

const APP_NAME = "TravelSys";

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;padding:16px 24px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;">${APP_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">${title}</h2>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;color:#71717a;">
                  Email ini dikirim otomatis oleh ${APP_NAME}. Mohon tidak membalas email ini.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">${text}</p>`;
}

// ---------------------------------------------------------------------------
// Perubahan status pengajuan perjalanan
// ---------------------------------------------------------------------------

export type TripStatusEmail = "ACKNOWLEDGED" | "BOOKED" | "REJECTED";

const TRIP_STATUS_LABEL: Record<TripStatusEmail, string> = {
  ACKNOWLEDGED: "Diketahui",
  BOOKED: "Booking Selesai",
  REJECTED: "Dikembalikan",
};

export function tripStatusChanged(params: {
  name: string;
  code: string;
  status: TripStatusEmail;
  note?: string;
}): MailContent {
  const label = TRIP_STATUS_LABEL[params.status];
  const subject = `[${APP_NAME}] Pengajuan ${params.code}: ${label}`;

  let detail: string;
  switch (params.status) {
    case "ACKNOWLEDGED":
      detail = `Pengajuan perjalanan Anda dengan kode <strong>${params.code}</strong> telah <strong>diketahui</strong> oleh Officer dan diteruskan ke Travel Agent untuk proses booking.`;
      break;
    case "BOOKED":
      detail = `Booking untuk pengajuan <strong>${params.code}</strong> telah <strong>selesai</strong>. Silakan cek detail tiket di aplikasi.`;
      break;
    case "REJECTED":
      detail = `Pengajuan <strong>${params.code}</strong> <strong>dikembalikan</strong> oleh Travel Agent.${
        params.note ? ` Alasan: <em>${escapeHtml(params.note)}</em>` : ""
      }`;
      break;
  }

  const html = layout(`Status Pengajuan: ${label}`, [
    p(`Halo ${escapeHtml(params.name)},`),
    p(detail),
    p(`Masuk ke aplikasi untuk melihat detail pengajuan Anda.`),
  ].join(""));

  const text =
    `Halo ${params.name},\n\n` +
    `Status pengajuan ${params.code} berubah menjadi: ${label}.` +
    (params.note ? `\nAlasan: ${params.note}` : "") +
    `\n\nMasuk ke aplikasi untuk melihat detailnya.`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export function passwordChanged(params: { name: string }): MailContent {
  const subject = `[${APP_NAME}] Password Anda telah diubah`;
  const html = layout("Password Diubah", [
    p(`Halo ${escapeHtml(params.name)},`),
    p(`Password akun Anda baru saja <strong>diubah</strong>.`),
    p(
      `Jika Anda tidak merasa melakukan perubahan ini, segera hubungi administrator.`
    ),
  ].join(""));
  const text =
    `Halo ${params.name},\n\n` +
    `Password akun Anda baru saja diubah. ` +
    `Jika Anda tidak merasa melakukan perubahan ini, segera hubungi administrator.`;
  return { subject, html, text };
}

export function passwordResetByAdmin(params: { name: string }): MailContent {
  const subject = `[${APP_NAME}] Password Anda direset oleh administrator`;
  const html = layout("Password Direset", [
    p(`Halo ${escapeHtml(params.name)},`),
    p(
      `Password akun Anda telah <strong>direset</strong> oleh administrator. Gunakan password sementara yang diberikan admin untuk masuk, lalu ganti password Anda.`
    ),
    p(`Jika Anda tidak mengetahui hal ini, segera hubungi administrator.`),
  ].join(""));
  const text =
    `Halo ${params.name},\n\n` +
    `Password akun Anda telah direset oleh administrator. ` +
    `Gunakan password sementara yang diberikan admin untuk masuk, lalu ganti password Anda.`;
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Aktivasi / deaktivasi akun
// ---------------------------------------------------------------------------

export function accountActivation(params: {
  name: string;
  active: boolean;
}): MailContent {
  const subject = params.active
    ? `[${APP_NAME}] Akun Anda telah diaktifkan`
    : `[${APP_NAME}] Akun Anda telah dinonaktifkan`;
  const body = params.active
    ? `Akun Anda telah <strong>diaktifkan</strong>. Anda sekarang dapat masuk dan menggunakan aplikasi.`
    : `Akun Anda telah <strong>dinonaktifkan</strong> oleh administrator. Anda tidak dapat masuk sampai akun diaktifkan kembali.`;
  const html = layout(
    params.active ? "Akun Diaktifkan" : "Akun Dinonaktifkan",
    [
      p(`Halo ${escapeHtml(params.name)},`),
      p(body),
      p(`Hubungi administrator bila ada pertanyaan.`),
    ].join("")
  );
  const text =
    `Halo ${params.name},\n\n` +
    (params.active
      ? "Akun Anda telah diaktifkan. Anda sekarang dapat masuk dan menggunakan aplikasi."
      : "Akun Anda telah dinonaktifkan oleh administrator. Anda tidak dapat masuk sampai akun diaktifkan kembali.") +
    `\n\nHubungi administrator bila ada pertanyaan.`;
  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
