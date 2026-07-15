'use client'

import { useState } from 'react'

function getMinDate() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return d.toISOString().slice(0, 10)
}

const TEST_BOOK_PAYLOAD = {
  booking_date: '2026-02-25',
  driver_id: '11111111-1111-1111-1111-111111111111',
  tour_id: '22222222-2222-2222-2222-222222222201',
  vehicle_id: '33333333-3333-3333-3333-333333333301',
  client_name: 'Test Client',
  client_email: 'test@email.com',
}

export default function Home() {
  const [date, setDate] = useState(getMinDate())
  const [result, setResult] = useState<{ available?: boolean; reason?: string; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [bookResult, setBookResult] = useState<Record<string, unknown> | null>(null)
  const [bookLoading, setBookLoading] = useState(false)

  async function checkAvailability() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/availability?date=${date}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ error: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  async function testBook() {
    setBookLoading(true)
    setBookResult(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_BOOK_PAYLOAD),
      })
      const data = await res.json()
      setBookResult(data)
    } catch (e) {
      setBookResult({ error: (e as Error).message })
    } finally {
      setBookLoading(false)
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '40rem' }}>
      <h1>YJ Private Tours — Booking API</h1>
      <p>Use the API routes for availability and bookings.</p>
      <ul>
        <li><code>GET /api/availability?date=YYYY-MM-DD</code> — Check if a date is available</li>
        <li><code>POST /api/book</code> — Create a pending booking</li>
        <li><code>POST /api/payment-webhook</code> — Confirm booking after payment</li>
      </ul>

      <hr style={{ margin: '2rem 0' }} />

      <h2>Test availability</h2>
      <p style={{ color: '#666' }}>Pick a date and check if it’s available (must be at least 2 days from today).</p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={date}
          min={getMinDate()}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <button
          type="button"
          onClick={checkAvailability}
          disabled={loading}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Checking…' : 'Check availability'}
        </button>
      </div>
      {result && (
        <pre style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '6px', overflow: 'auto' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      <hr style={{ margin: '2rem 0' }} />

      <h2>Test book</h2>
      <p style={{ color: '#666' }}>Create a pending booking with the default test payload (date 2026-02-25, Test Client).</p>
      <button
        type="button"
        onClick={testBook}
        disabled={bookLoading}
        style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: bookLoading ? 'wait' : 'pointer' }}
      >
        {bookLoading ? 'Sending…' : 'POST /api/book'}
      </button>
      {bookResult && (
        <pre style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '6px', overflow: 'auto' }}>
          {JSON.stringify(bookResult, null, 2)}
        </pre>
      )}
    </main>
  )
}
