import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transport email via Gmail SMTP (App Password).
 *
 * Env yang dibutuhkan (lihat .env.example):
 * - GMAIL_SMTP_USER : alamat Gmail pengirim
 * - GMAIL_SMTP_PASS : App Password Gmail (bukan password akun)
 * - MAIL_FROM       : opsional, header From (default: GMAIL_SMTP_USER)
 *
 * Bila env belum diisi, pengiriman dilewati secara diam-diam (best-effort)
 * agar alur aplikasi tidak pernah gagal karena email.
 */

let cached: Transporter | null = null;

function getTransport(): Transporter | null {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_PASS;
  if (!user || !pass) return null;

  if (!cached) {
    cached = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return cached;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS);
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Kirim email (best-effort). Tidak pernah melempar error — kegagalan hanya
 * dicatat ke console agar aksi utama (ubah status, ganti password, dll.)
 * tetap sukses.
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      "[mail] GMAIL_SMTP_USER/GMAIL_SMTP_PASS belum diset — email dilewati:",
      input.subject
    );
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.GMAIL_SMTP_USER,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return true;
  } catch (err) {
    console.error("[mail] Gagal mengirim email:", input.subject, err);
    return false;
  }
}
