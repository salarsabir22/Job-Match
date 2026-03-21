/**
 * Optional Resend-powered confirmation when someone joins the waitlist.
 * Set RESEND_API_KEY (+ WAITLIST_EMAIL_FROM) in env; if missing, signup still succeeds.
 */

const RESEND_API = "https://api.resend.com/emails"

function buildWaitlistEmailHtml(): string {
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
              <div style="width:56px;height:56px;background:#10b981;border-radius:999px;margin:0 auto 20px;line-height:56px;text-align:center;color:#ffffff;font-size:26px;font-weight:600;">&#10003;</div>
              <p style="margin:0;color:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:18px;font-weight:600;letter-spacing:-0.02em;">You&#39;re on the waitlist</p>
              <p style="margin:14px 0 0;color:rgba(255,255,255,0.5);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.55;max-width:360px;">
                Thanks for joining <strong style="color:rgba(255,255,255,0.85);">JobMatch</strong> early access. We&apos;ll email you once when your spot opens &mdash; no spam.
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

export async function sendWaitlistConfirmationEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not set" }
  }

  const from =
    process.env.WAITLIST_EMAIL_FROM?.trim() ||
    "JobMatch <onboarding@resend.dev>"

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "You're on the JobMatch waitlist",
        html: buildWaitlistEmailHtml(),
      }),
    })

    const json = (await res.json().catch(() => ({}))) as { message?: string }

    if (!res.ok) {
      console.error("[waitlist email] Resend error:", res.status, json)
      return { ok: false, error: json.message || `Resend ${res.status}` }
    }

    return { ok: true }
  } catch (e) {
    console.error("[waitlist email]", e)
    return { ok: false, error: e instanceof Error ? e.message : "send failed" }
  }
}
