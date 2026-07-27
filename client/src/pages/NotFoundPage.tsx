import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-brand-cream-light px-4 py-16 flex items-center">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-green/70">404</p>
          <h1 className="text-3xl font-bold text-brand-green">Page not found</h1>
          <p className="text-brand-green/80">
            That link does not match a page on KhayrCape Experiences. Try one of these instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/"
              className="inline-flex justify-center min-h-12 items-center px-5 rounded-lg bg-brand-green text-brand-cream font-semibold"
            >
              Go home
            </Link>
            <Link
              to="/book"
              className="inline-flex justify-center min-h-12 items-center px-5 rounded-lg border border-brand-green text-brand-green font-semibold"
            >
              Book a tour
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
