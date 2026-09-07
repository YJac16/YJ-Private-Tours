import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageMeta from '../components/PageMeta'

export default function PrivacyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy — KhayrCape Experiences"
        description="How KhayrCape Experiences collects, uses, and protects your personal information under POPIA (South Africa)."
        path="/privacy"
      />
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex text-brand-green hover:underline text-sm mb-6">
            ← Back to home
          </Link>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-green mb-2 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-brand-green/80 text-sm mb-10">
            Last updated: {new Date().getFullYear()} · Prepared for the Protection of Personal Information
            Act 4 of 2013 (POPIA)
          </p>

          <div className="space-y-8 text-brand-green/90 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">1. Who we are</h2>
              <p className="mb-3">
                KhayrCape Experiences (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides private guided
                tours and related booking services in Cape Town, South Africa. For POPIA purposes, we are the
                responsible party for personal information collected through this website and our booking
                channels.
              </p>
              <p className="mb-2 font-medium text-brand-green">Information Officer</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Name: Yaseen (Information Officer)</li>
                <li>
                  WhatsApp:{' '}
                  <a
                    href="https://wa.me/27823277446"
                    className="underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +27 82 327 7446
                  </a>
                </li>
                <li>Location: Cape Town, South Africa</li>
              </ul>
              <p className="mt-3 text-sm text-brand-green/70">
                Please update the formal legal entity name and postal address here once confirmed for
                registration and correspondence.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">
                2. Personal information we collect
              </h2>
              <p className="mb-3">Depending on how you use our services, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-brand-green">Identity &amp; contact:</strong> full name, email
                  address, phone number, country
                </li>
                <li>
                  <strong className="text-brand-green">Booking details:</strong> tour selection, date, group
                  size, pickup address, flight number, dietary requirements, special requests
                </li>
                <li>
                  <strong className="text-brand-green">Account data:</strong> login credentials (handled by
                  our auth provider), profile name and phone
                </li>
                <li>
                  <strong className="text-brand-green">Payment references:</strong> booking identifiers and
                  limited metadata needed to confirm payment (card data is processed by Yoco — we do not
                  store full card numbers)
                </li>
                <li>
                  <strong className="text-brand-green">Technical data:</strong> session information required
                  to keep you signed in, and basic logs needed to operate and secure the site
                </li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">
                3. Why we process your information
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To respond to enquiries and confirm private tour bookings</li>
                <li>To arrange pickup, allocate vehicles and guides, and deliver the experience</li>
                <li>To process payments and send booking confirmations</li>
                <li>To create and manage optional customer accounts</li>
                <li>To meet legal, accounting, and safety obligations</li>
                <li>To improve our website and prevent fraud or abuse</li>
              </ul>
              <p className="mt-3">
                We process information where it is necessary to perform a contract with you, where we have a
                legitimate interest (for example securing bookings and operating the business), where the law
                requires it, or where you have given consent (for example creating an account or accepting
                optional cookies if introduced later).
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">
                4. Who we share information with
              </h2>
              <p className="mb-3">
                We only share personal information with service providers who help us operate, and only as
                needed for those purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-brand-green">Supabase</strong> — authentication and database hosting
                </li>
                <li>
                  <strong className="text-brand-green">Yoco</strong> — secure payment processing
                </li>
                <li>
                  <strong className="text-brand-green">Resend / email SMTP</strong> — transactional booking
                  notifications
                </li>
                <li>
                  <strong className="text-brand-green">Vercel</strong> — website and API hosting
                </li>
                <li>
                  <strong className="text-brand-green">Google Maps</strong> — embedded maps on experience
                  pages (may set cookies or load content from Google)
                </li>
                <li>
                  <strong className="text-brand-green">WhatsApp / Meta</strong> — when you choose to contact
                  or continue a booking conversation on WhatsApp
                </li>
              </ul>
              <p className="mt-3">
                Some providers may process data outside South Africa. Where that happens, we take reasonable
                steps to ensure appropriate safeguards consistent with POPIA.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">5. Cookies and similar tech</h2>
              <p>
                We use essential storage to keep you signed in and operate the site. See our{' '}
                <Link to="/cookies" className="underline font-semibold">
                  Cookie Policy
                </Link>{' '}
                for details and how to manage preferences.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">6. Retention</h2>
              <p>
                We keep booking and account records for as long as needed to fulfil the booking, handle
                follow-ups, and meet tax or legal requirements. When information is no longer needed, we
                delete or de-identify it where reasonably practicable.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">
                7. Your rights under POPIA
              </h2>
              <p className="mb-3">You may request to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Access the personal information we hold about you</li>
                <li>Correct or update inaccurate information</li>
                <li>Object to certain processing, where applicable</li>
                <li>Request deletion, subject to legal retention obligations</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact the Information Officer via WhatsApp at{' '}
                <a
                  href="https://wa.me/27823277446?text=Privacy%20request"
                  className="underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +27 82 327 7446
                </a>
                . We may need to verify your identity before responding.
              </p>
              <p className="mt-3">
                You may also lodge a complaint with the Information Regulator (South Africa) if you believe
                your rights have been infringed.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">
                8. Children and special information
              </h2>
              <p>
                Our services are not aimed at children under 18 without a parent or guardian. If you share
                dietary or health-related notes for a booking, we use that information only to deliver a
                suitable experience and keep it confidential.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">9. Security</h2>
              <p>
                We use reputable providers, access controls, and HTTPS to help protect personal information.
                No online system is completely secure; please use strong passwords for any account you create.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">10. Changes</h2>
              <p>
                We may update this policy from time to time. The &quot;Last updated&quot; date at the top will
                change when we do. Continued use of the site after updates means you accept the revised
                policy.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <p className="text-sm text-brand-green/70 pt-2">
              This page is a practical privacy notice for website and booking use. It is not a substitute for
              formal legal advice. Have a qualified adviser review it before relying on it as final POPIA
              compliance documentation.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
