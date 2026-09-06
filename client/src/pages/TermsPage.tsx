import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageMeta from '../components/PageMeta'

export default function TermsPage() {
  return (
    <>
      <PageMeta
        title="Terms & Conditions — KhayrCape Experiences"
        description="Booking terms, cancellation policy, and conditions for private Cape Town tours with KhayrCape Experiences."
        path="/terms"
      />
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex text-brand-green hover:underline text-sm mb-6">
            ← Back to home
          </Link>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-green mb-2 leading-tight">
            Terms &amp; Conditions | Booking &amp; Cancellation Policy
          </h1>
          <p className="text-brand-green/80 text-sm mb-10">
            Last updated: {new Date().getFullYear()}
          </p>

          <div className="space-y-8 text-brand-green/90 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">1. Booking Process</h2>
              <p className="mb-3">All tours are private and operate on a pre-booking basis.</p>
              <p className="mb-2 font-medium text-brand-green">You can book in either of these ways:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-brand-green">Online:</strong> complete the booking flow on this
                  website (select experience, date, vehicle, and guest details), then pay securely via Yoco
                  checkout.
                </li>
                <li>
                  <strong className="text-brand-green">WhatsApp:</strong> message us to check availability;
                  we may send a Yoco payment link to confirm.
                </li>
              </ul>
              <p className="mt-3">Bookings are only confirmed once payment has been received.</p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">2. Payment</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Payments are processed securely via Yoco (online checkout or a payment link sent on
                  WhatsApp).
                </li>
                <li>Full payment is required to confirm your booking.</li>
                <li>Prices are quoted in South African Rand (ZAR).</li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">3. Cancellation Policy</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Cancellations must be made at least <strong className="text-brand-green">24 hours (1 day)</strong> in
                  advance of the scheduled tour.
                </li>
                <li>Cancellations made more than 24 hours in advance will qualify for a full refund.</li>
                <li>
                  Cancellations made less than 24 hours before the tour will{' '}
                  <strong className="text-brand-green">not be refunded</strong>.
                </li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">4. Rescheduling</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Rescheduling requests are allowed up to 24 hours before the tour, subject to availability.
                </li>
                <li>
                  We will do our best to accommodate changes, but cannot guarantee alternative time slots.
                </li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">5. Late Arrivals / No Shows</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Guests are expected to be ready at the agreed pickup time.</li>
                <li>Late arrivals may result in reduced tour time.</li>
                <li>No-shows will be treated as a last-minute cancellation and are non-refundable.</li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">6. Weather &amp; Safety</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Tours operate in most weather conditions.</li>
                <li>In the case of extreme weather or unsafe conditions, the tour may be rescheduled.</li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">7. Vehicle &amp; Capacity</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Vehicle allocation is based on group size and availability.</li>
                <li>Requests for specific vehicles can be made but are subject to availability.</li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">8. Child Policy</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Family-friendly tours are welcome.</li>
                <li>
                  Please inform us in advance if travelling with children so we can accommodate appropriately.
                </li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">9. Liability</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  While all reasonable care is taken to ensure safety and comfort, guests participate at their own risk.
                </li>
                <li>
                  We are not responsible for loss, damage, or delays caused by factors beyond our control (traffic,
                  weather, road closures, etc.).
                </li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">10. Privacy</h2>
              <p>
                Personal information collected for bookings and accounts is handled as described in our{' '}
                <Link to="/privacy" className="underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">11. Contact</h2>
              <p>
                For bookings and enquiries, use the online booking page or WhatsApp at{' '}
                <a
                  href="https://wa.me/27823277446"
                  className="underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +27 82 327 7446
                </a>
                .
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <p className="text-brand-green font-medium pt-2">
              By confirming a booking, you agree to the above Terms &amp; Conditions.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
