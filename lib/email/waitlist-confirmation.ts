/**
 * Waitlist mail over SMTP (Gmail or the same SMTP as Supabase Auth).
 * Signup still succeeds if SMTP is not configured.
 */

import { sendMail, smtpConfigured } from "@/lib/email/smtp"

function confirmationHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;background:#050505;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:36px 28px;">
          <tr>
            <td align="center">
              <p style="margin:0;color:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:18px;font-weight:600;letter-spacing:-0.02em;">You&#39;re on the waitlist</p>
              <p style="margin:14px 0 0;color:rgba(255,255,255,0.5);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.55;max-width:360px;">
                Thanks for joining <strong style="color:rgba(255,255,255,0.85);">swypejobs</strong> early access. We&apos;ll email you once when your spot opens &mdash; no spam.
              </p>
              <p style="margin:24px 0 0;color:rgba(255,255,255,0.28);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;line-height:1.5;">
                If you didn&#39;t sign up, you can ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function notifyHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="en"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <p>New swypejobs waitlist signup</p>
  <p><strong>${email.replace(/</g, "")}</strong></p>
  <p style="color:#666;font-size:13px;">Stored in <code>waitlist_emails</code>.</p>
</body></html>`
}

export async function sendWaitlistConfirmationEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  if (!smtpConfigured()) {
    return { ok: false, error: "SMTP not set" }
  }

  const confirmation = await sendMail({
    to,
    subject: "You're on the swypejobs waitlist",
    html: confirmationHtml(),
    text: "You're on the swypejobs waitlist. We'll email you once when early access opens.",
  })

  const notifyTo = (process.env.WAITLIST_NOTIFY_TO?.trim() || process.env.SMTP_USER?.trim() || "").toLowerCase()
  if (notifyTo && notifyTo !== to.toLowerCase()) {
    const notify = await sendMail({
      to: notifyTo,
      subject: `Waitlist: ${to}`,
      html: notifyHtml(to),
      text: `New waitlist signup: ${to}`,
    })
    if (!notify.ok) {
      console.warn("[waitlist] team notify:", notify.error)
    }
  }

  return confirmation
}
