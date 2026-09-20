import nodemailer from "nodemailer"

type SendMailInput = {
  to: string
  subject: string
  html: string
  text: string
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim())
}

function transporter() {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  if (!user || !pass) return null

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE === "false" ? false : port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export function mailFrom() {
  const user = process.env.SMTP_USER?.trim()
  const from = process.env.SMTP_FROM?.trim()
  return from || user || "JobMatch"
}

export async function sendMail(input: SendMailInput): Promise<{ ok: boolean; error?: string }> {
  const transport = transporter()
  if (!transport) {
    return { ok: false, error: "SMTP not set" }
  }

  try {
    await transport.sendMail({
      from: mailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    return { ok: true }
  } catch (e) {
    console.error("[smtp]", e)
    return { ok: false, error: e instanceof Error ? e.message : "send failed" }
  }
}
