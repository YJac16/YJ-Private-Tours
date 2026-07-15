/**
 * Local test: GET /api/availability?date=2026-02-25
 * Run with: node test-availability.js
 * (Start the dev server first: npm run dev)
 */
const date = process.argv[2] || '2026-02-25'
const url = `http://localhost:3000/api/availability?date=${date}`

fetch(url)
  .then((r) => r.json())
  .then((data) => {
    console.log('Response:', JSON.stringify(data, null, 2))
  })
  .catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
