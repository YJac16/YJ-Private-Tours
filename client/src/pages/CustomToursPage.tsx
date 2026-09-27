import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageMeta from '../components/PageMeta'
import JsonLd from '../components/JsonLd'
import {
  CUSTOM_TOURS_CHECKOUT_LINE,
  CUSTOM_TOURS_EXAMPLES,
  CUSTOM_TOURS_HOW_IT_WORKS,
  CUSTOM_TOURS_INTRO,
  CUSTOM_TOURS_PRICING_LINE,
  CUSTOM_TOURS_WHAT_TO_SEND,
  CUSTOM_TOURS_WHATSAPP_MESSAGE,
} from '../data/customToursCopy'
import { whatsappWithMessage } from '../lib/whatsappLinks'
import {
  CUSTOM_TOURS_META,
  buildCustomToursServiceJsonLd,
} from '../seo/routes'

const WA_HREF = whatsappWithMessage(CUSTOM_TOURS_WHATSAPP_MESSAGE)

export default function CustomToursPage() {
  return (
    <>
      <PageMeta
        title={CUSTOM_TOURS_META.title}
        description={CUSTOM_TOURS_META.description}
        path={CUSTOM_TOURS_META.path}
      />
      <JsonLd data={buildCustomToursServiceJsonLd()} />
      <Navbar />
      <main className="min-h-screen bg-brand-cream-light px-4 pt-10 pb-site-dock">
        <div className="max-w-3xl mx-auto space-y-10">
          <Link
            to="/"
            className="inline-flex text-brand-green hover:underline text-sm"
          >
            ← Back to home
          </Link>

          <header>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-green mb-4">
              Custom private tours
            </h1>
            <p className="text-brand-green/90 text-base md:text-lg leading-relaxed">
              {CUSTOM_TOURS_INTRO}
            </p>
          </header>

          <section>
            <h2 className="text-xl font-bold text-brand-green mb-3">Examples</h2>
            <ul className="list-disc pl-5 space-y-2 text-brand-green/90">
              {CUSTOM_TOURS_EXAMPLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green mb-3">How it works</h2>
            <ol className="list-decimal pl-5 space-y-2 text-brand-green/90">
              {CUSTOM_TOURS_HOW_IT_WORKS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-green mb-3">What to send us</h2>
            <ul className="list-disc pl-5 space-y-2 text-brand-green/90">
              {CUSTOM_TOURS_WHAT_TO_SEND.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 text-brand-green/90 leading-relaxed">
            <p>{CUSTOM_TOURS_CHECKOUT_LINE}</p>
            <p>{CUSTOM_TOURS_PRICING_LINE}</p>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-12 px-6 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-colors shadow-md"
            >
              Plan a custom tour
            </a>
            <Link
              to="/book"
              className="inline-flex items-center justify-center min-h-12 px-6 py-3 border-2 border-brand-green/30 text-brand-green font-semibold rounded-xl hover:bg-brand-green/5 transition-colors"
            >
              Book a package online
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
