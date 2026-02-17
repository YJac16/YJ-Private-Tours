import express from 'express'
import { createCheckout } from '../controllers/checkoutController.js'

const router = express.Router()

// POST /api/checkout — create Yoco checkout session, returns { redirectUrl, checkoutId }
router.post('/checkout', createCheckout)

export default router
