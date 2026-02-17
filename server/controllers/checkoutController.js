/**
 * Yoco Checkout API — create checkout session server-side.
 * Never expose secret key to client. Use env YOCO_SECRET_KEY (test or live).
 */

const YOCO_CHECKOUT_URL = 'https://payments.yoco.com/api/checkouts'

export async function createCheckout(req, res) {
  const secretKey = process.env.YOCO_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({ message: 'Payment is not configured (missing YOCO_SECRET_KEY).' })
  }

  const { amountCents, tourId, tourTitle, customerName, customerEmail, customerPhone } = req.body

  if (amountCents == null || !Number.isInteger(Number(amountCents)) || Number(amountCents) < 100) {
    return res.status(400).json({ message: 'Valid amount in cents is required (minimum 100).' })
  }

  const baseUrl = process.env.FRONTEND_URL || process.env.RAILWAY_STATIC_URL || 'http://localhost:5173'
  const successUrl = `${baseUrl.replace(/\/$/, '')}/thank-you?payment=success`
  const cancelUrl = `${baseUrl.replace(/\/$/, '')}/checkout/${tourId || ''}?cancelled=1`
  const failureUrl = `${baseUrl.replace(/\/$/, '')}/thank-you?payment=failure`

  const payload = {
    amount: Number(amountCents),
    currency: 'ZAR',
    successUrl,
    cancelUrl,
    failureUrl,
    metadata: {
      tourId: tourId || '',
      tourTitle: tourTitle || '',
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
    },
  }

  try {
    const response = await fetch(YOCO_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Yoco checkout error:', response.status, data)
      return res.status(response.status).json({
        message: data.message || data.error || 'Could not create payment session.',
      })
    }

    if (!data.redirectUrl) {
      return res.status(500).json({ message: 'Invalid response from payment provider.' })
    }

    return res.json({
      redirectUrl: data.redirectUrl,
      checkoutId: data.id,
    })
  } catch (err) {
    console.error('Yoco checkout request failed:', err)
    return res.status(500).json({ message: 'Payment service unavailable.' })
  }
}
