import nodemailer from 'nodemailer'

// Build transporter from env (see .env for SMTP placeholders)
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const TOUR_LABELS = {
  'cape-peninsula': 'Cape Peninsula Private Tour (Half-Day)',
  'bo-kaap': 'Bo-Kaap & Cultural Heritage Tour',
  'winelands': 'Cape Winelands Tour (Halal-friendly options)',
  'other': 'Other / Not sure yet',
}

/**
 * POST /api/enquiry
 * Validates body, sends email to business, returns success or error.
 */
export async function submitEnquiry(req, res) {
  try {
    const { name, email, phone, tourInterest, message } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' })
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' })
    }
    if (!tourInterest || typeof tourInterest !== 'string' || !tourInterest.trim()) {
      return res.status(400).json({ message: 'Tour interest is required.' })
    }

    const businessEmail = process.env.BUSINESS_EMAIL
    if (!businessEmail) {
      console.error('BUSINESS_EMAIL not set in .env')
      return res.status(500).json({ message: 'Server configuration error. Please try again later.' })
    }

    const tourLabel = TOUR_LABELS[tourInterest] || tourInterest
    const html = `
      <h2>New Enquiry — KhayrCape Experiences</h2>
      <p><strong>Name:</strong> ${escapeHtml(name.trim())}</p>
      <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
      <p><strong>Phone:</strong> ${phone ? escapeHtml(phone.trim()) : '—'}</p>
      <p><strong>Tour interest:</strong> ${escapeHtml(tourLabel)}</p>
      <p><strong>Message:</strong></p>
      <p>${message ? escapeHtml(message.trim()).replace(/\n/g, '<br>') : '—'}</p>
    `

    const transporter = getTransporter()
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: businessEmail,
      subject: `Enquiry from ${name.trim()} — KhayrCape Experiences`,
      html,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\nTour: ${tourLabel}\nMessage: ${message || '—'}`,
    })

    res.status(200).json({ message: 'Enquiry sent successfully.' })
  } catch (err) {
    console.error('Enquiry send error:', err)
    res.status(500).json({
      message: err.message || 'Failed to send enquiry. Please try again or contact us on WhatsApp.',
    })
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return String(text).replace(/[&<>"']/g, (c) => map[c])
}
