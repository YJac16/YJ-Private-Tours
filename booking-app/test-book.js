/**
 * Test POST /api/book
 * Run with: node test-book.js
 * (Start the dev server first: npm run dev)
 */
const payload = {
  booking_date: '2026-02-25',
  driver_id: '11111111-1111-1111-1111-111111111111',
  tour_id: '22222222-2222-2222-2222-222222222201',
  vehicle_id: '33333333-3333-3333-3333-333333333301',
  client_name: 'Test Client',
  client_email: 'test@email.com',
}

fetch('http://localhost:3000/api/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then((r) => r.json())
  .then((data) => {
    console.log('Response:', JSON.stringify(data, null, 2))
  })
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
