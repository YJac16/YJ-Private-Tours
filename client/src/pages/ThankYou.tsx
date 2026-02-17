import { Link, useSearchParams } from 'react-router-dom'
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import Footer from '../components/Footer'

export default function ThankYou() {
  const [searchParams] = useSearchParams()
  const payment = searchParams.get('payment')
  const isPaymentSuccess = payment === 'success'
  const isPaymentFailure = payment === 'failure'

  return (
    <>
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
          <p className="text-brand-green/90 text-lg mb-8">
            {isPaymentSuccess && 'Your payment was successful. We will be in touch to confirm your tour details.'}
            {isPaymentFailure && 'Something went wrong with the payment. You can try again or contact us to book via WhatsApp.'}
            {!isPaymentSuccess && !isPaymentFailure && "Your enquiry has been received. We'll get back to you as soon as possible."}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-brand-cream font-medium rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>
      <Footer />
    </>
  )
}
