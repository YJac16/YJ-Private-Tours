import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { confirmPayment } from '../lib/bookingApi'

export default function ThankYou() {
  const [searchParams] = useSearchParams()
  const payment = searchParams.get('payment')
  const bookingId = searchParams.get('booking_id')
  const isPaymentSuccess = payment === 'success'
  const isPaymentFailure = payment === 'failure'
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!isPaymentSuccess || !bookingId) return
    let cancelled = false
    setConfirming(true)
    confirmPayment(bookingId)
      .then(() => {
        if (!cancelled) setConfirmed(true)
      })
      .catch(() => {
        /* webhook may still confirm; success page still valid */
      })
      .finally(() => {
        if (!cancelled) setConfirming(false)
      })
    return () => {
      cancelled = true
    }
  }, [isPaymentSuccess, bookingId])

  return (
    <>
      <Navbar />
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-brand-cream">
        <div className="max-w-md mx-auto text-center">
          {isPaymentFailure ? (
            <HiOutlineXCircle className="text-6xl text-amber-500 mx-auto mb-6" />
          ) : (
            <HiOutlineCheckCircle className="text-6xl text-brand-green mx-auto mb-6" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
            {isPaymentSuccess && 'Payment successful'}
            {isPaymentFailure && 'Payment could not be completed'}
            {!isPaymentSuccess && !isPaymentFailure && 'Thank You'}
          </h1>
          <p className="text-brand-green/90 text-lg mb-4">
            {isPaymentSuccess &&
              'Your Yoco payment was successful. Your tour booking is confirmed.'}
            {isPaymentFailure &&
              'Something went wrong with the payment. You can try again from the booking page.'}
            {!isPaymentSuccess &&
              !isPaymentFailure &&
              "Your enquiry has been received. We'll get back to you as soon as possible."}
          </p>
          {bookingId && (
            <p className="text-sm text-brand-green/70 mb-6 font-mono">
              Ref: {bookingId.slice(0, 8)}
              {confirming ? ' · confirming…' : confirmed ? ' · confirmed' : ''}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isPaymentFailure && (
              <Link
                to="/book"
                className="inline-block px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors min-h-[48px]"
              >
                Try booking again
              </Link>
            )}
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors min-h-[48px]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
