import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import enquiryRoutes from './routes/enquiryRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

// CORS: allow frontend origin (Vite dev + production domains)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Health check (for Render/Fly.io)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// API routes
app.use('/api', enquiryRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
