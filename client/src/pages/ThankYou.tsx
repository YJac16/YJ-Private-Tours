import { Link } from 'react-router-dom'
import { HiOutlineCheckCircle } from 'react-icons/hi'
import Footer from '../components/Footer'

export default function ThankYou() {
  return (
    <>
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-brand-cream">
        <div className="max-w-md mx-auto text-center">
          <HiOutlineCheckCircle className="text-6xl text-brand-green mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
            Thank You
          </h1>
          <p className="text-brand-green/90 text-lg mb-8">
            Your enquiry has been received. We’ll get back to you as soon as possible.
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
