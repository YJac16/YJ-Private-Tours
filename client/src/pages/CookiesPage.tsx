import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-cream">
        <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex text-brand-green hover:underline text-sm mb-6">
            ← Back to home
          </Link>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-green mb-2 leading-tight">
            Cookie Policy
          </h1>
          <p className="text-brand-green/80 text-sm mb-10">
            Last updated: {new Date().getFullYear()}
          </p>

          <div className="space-y-8 text-brand-green/90 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">1. What are cookies?</h2>
              <p>
                Cookies and similar technologies (including browser <code className="text-sm">localStorage</code>{' '}
                and <code className="text-sm">sessionStorage</code>) help websites remember preferences, keep
                you signed in, and understand how the site is used. This policy explains what KhayrCape
                Experiences uses today.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">2. Essential cookies &amp; storage</h2>
              <p className="mb-3">
                These are required for the site to work. They cannot be switched off in our banner without
                breaking sign-in or booking flows.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-brand-green">Authentication session</strong> — Supabase Auth stores
                  a session so you stay signed in across page loads
                </li>
                <li>
                  <strong className="text-brand-green">Cookie preference</strong> — we store your banner choice
                  in <code className="text-sm">localStorage</code> (<code className="text-sm">cookie_consent</code>)
                  so we do not show the notice on every visit
                </li>
              </ul>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">3. Optional / third-party</h2>
              <p className="mb-3">
                We do not currently run advertising or analytics cookies (such as Google Analytics) on this
                site. If we add them later, we will update this policy and ask for optional consent where
                required.
              </p>
              <p>
                Experience pages may embed <strong className="text-brand-green">Google Maps</strong> iframes.
                Google may set its own cookies or collect technical data when that content loads. See
                Google&apos;s privacy documentation for details. You can avoid map embeds by not visiting
                those sections, or by using browser controls to block third-party cookies.
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">4. Managing preferences</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Use our on-site cookie notice to acknowledge essential cookies. Your choice is saved
                  locally in your browser.
                </li>
                <li>
                  Clear site data in your browser settings to reset the notice and sign-out sessions.
                </li>
                <li>
                  Most browsers let you block or delete cookies. Blocking essential storage may prevent
                  sign-in from working.
                </li>
              </ul>
              <p className="mt-3">
                For how we handle personal information more broadly, read our{' '}
                <Link to="/privacy" className="underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>

            <hr className="border-brand-cream-dark" />

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-brand-green mb-3">5. Contact</h2>
              <p>
                Questions about cookies or privacy? Message us on WhatsApp at{' '}
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
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
