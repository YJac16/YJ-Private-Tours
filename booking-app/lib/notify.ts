import nodemailer from 'nodemailer'

export type BookingEmailDetails = {
  bookingId: string
  status: 'pending' | 'paid' | 'cancelled'
  bookingDate: string
  startTime: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  tourName?: string | null
  vehicleName?: string | null
  driverName?: string | null
  notes?: string | null
  amountCents?: number | null
}

function escapeHtml(text: string) {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return String(text).replace(/[&<>"']/g, (c) => map[c] || c)
}

function formatMoney(cents?: number | null) {
  if (cents == null || !Number.isFinite(cents)) return '—'
  return `R${(cents / 100).toLocaleString('en-ZA')}`
}

function buildBodies(details: BookingEmailDetails, kind: 'created' | 'paid') {
  const title =
    kind === 'paid'
      ? 'Booking paid & confirmed'
      : 'New booking request (awaiting payment / confirmation)'

  const lines = [
    title,
    '',
    `Ref: ${details.bookingId}`,
    `Status: ${details.status}`,
    `Date: ${details.bookingDate} (guest bookings require at least 2 days' notice)`,
    `Time: ${String(details.startTime).slice(0, 5)}`,
    `Tour: ${details.tourName || '—'}`,
    `Vehicle: ${details.vehicleName || '—'}`,
    `Driver: ${details.driverName || '—'}`,
    `Guest: ${details.clientName}`,
    `Email: ${details.clientEmail}`,
    `Phone: ${details.clientPhone || '—'}`,
    `Amount: ${formatMoney(details.amountCents)}`,
    `Notes: ${details.notes || '—'}`,
    '',
    `Manage schedule: ${(process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '')}/driver`,
  ]

  const html = `
    <h2>${escapeHtml(title)}</h2>
    <p><strong>Ref:</strong> ${escapeHtml(details.bookingId)}</p>
    <p><strong>Status:</strong> ${escapeHtml(details.status)}</p>
    <p><strong>Date:</strong> ${escapeHtml(details.bookingDate)} <em>(min. 2 days' notice required)</em></p>
    <p><strong>Time:</strong> ${escapeHtml(String(details.startTime).slice(0, 5))}</p>
    <p><strong>Tour:</strong> ${escapeHtml(details.tourName || '—')}</p>
    <p><strong>Vehicle:</strong> ${escapeHtml(details.vehicleName || '—')}</p>
    <p><strong>Driver:</strong> ${escapeHtml(details.driverName || '—')}</p>
    <p><strong>Guest:</strong> ${escapeHtml(details.clientName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(details.clientEmail)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(details.clientPhone || '—')}</p>
    <p><strong>Amount:</strong> ${escapeHtml(formatMoney(details.amountCents))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(details.notes || '—')}</p>
    <p><a href="${escapeHtml((process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '') + '/driver')}">Open driver schedule</a></p>
  `

  return {
    subject: `${kind === 'paid' ? '✅ Paid' : '📩 New'} booking — ${details.bookingDate} ${String(details.startTime).slice(0, 5)} — KhayrCape`,
    text: lines.join('\n'),
    html,
  }
}

export async function notifyDriverBooking(
  details: BookingEmailDetails,
  kind: 'created' | 'paid' = 'created'
): Promise<{ sent: boolean; reason?: string }> {
  const to = process.env.DRIVER_NOTIFY_EMAIL || 'yaseenjacobs@icloud.com'
  const { subject, text, html } = buildBodies(details, kind)

  // Prefer Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:
            process.env.EMAIL_FROM ||
            'KhayrCape Bookings <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('[email] Resend failed', err)
        return { sent: false, reason: err }
      }
      return { sent: true }
    } catch (e) {
      console.error('[email] Resend error', e)
      return { sent: false, reason: e instanceof Error ? e.message : 'Resend error' }
    }
  }

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) {
    console.warn(
      `[email] Not sent (configure SMTP_USER/SMTP_PASS or RESEND_API_KEY). Would notify ${to}: ${subject}`
    )
    console.warn('[email] body:\n' + text)
    return {
      sent: false,
      reason: 'Email not configured. Set SMTP_USER + SMTP_PASS (Gmail App Password) or RESEND_API_KEY.',
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    })

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `KhayrCape Experiences <${user}>`,
      to,
      replyTo: details.clientEmail,
      subject,
      text,
      html,
    })
    return { sent: true }
  } catch (e) {
    console.error('[email] SMTP failed', e)
    return { sent: false, reason: e instanceof Error ? e.message : 'SMTP error' }
  }
}
