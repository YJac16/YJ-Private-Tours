import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import TermsPage from '../../pages/TermsPage'
import PrivacyPage from '../../pages/PrivacyPage'
import CookiesPage from '../../pages/CookiesPage'
import { SsrAuthProvider } from '../../lib/auth'
import { EXPERIENCE_DEFAULTS } from '../../data/experienceDefaults'
import {
  FLOOR_VEHICLES,
  getFloorTour,
  siteLowestFromLabel,
} from '../../data/catalogFloors'
import { HERMANUS_DURATION_LABEL } from '../../data/hermanusDuration'
import { galleryImages } from '../../data/gallery'
import { formatFromOneGuest, formatZarComma, startingFromCents } from '../../lib/pricing'
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  GUIDE_REGISTRATION_LABEL,
  SITE,
} from '../siteConfig'
import { EXPERIENCE_SLUGS } from '../routes'

function escapeText(text: string): string {
  return text
}

function durationForSlug(slug: string, content: (typeof EXPERIENCE_DEFAULTS)[string]): string {
  if (slug === 'hermanus') return HERMANUS_DURATION_LABEL
  return content.duration_label || ''
}

function fromPriceForSlug(slug: string): string {
  const tour = getFloorTour(slug)
  if (!tour) return ''
  const cents = startingFromCents(tour, FLOOR_VEHICLES, 1)
  if (slug === 'hermanus') {
    return `From ${formatZarComma(cents)}`
  }
  return formatFromOneGuest(cents)
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i}>{escapeText(para)}</p>
      ))}
    </>
  )
}

function ExperiencePrerender({ slug }: { slug: string }) {
  const content = EXPERIENCE_DEFAULTS[slug]
  if (!content) return null
  const duration = durationForSlug(slug, content)
  const fromPrice = fromPriceForSlug(slug)

  return (
    <article data-prerender="body">
      <header>
        <h1>{content.display_name}</h1>
        <p>{content.short_description}</p>
        <p>{content.hero_tagline}</p>
        <p>
          Private Muslim-friendly tour with {BUSINESS_NAME} — halal-aware stops
          and pacing on request where relevant.
        </p>
        <p>
          <strong>Duration:</strong> {duration}
          {fromPrice ? (
            <>
              {' '}
              · <strong>{fromPrice}</strong>
            </>
          ) : null}
        </p>
      </header>

      <section>
        <h2>Overview</h2>
        <Paragraphs text={content.detailed_description} />
      </section>

      {content.timeline.length > 0 && (
        <section>
          <h2>Itinerary</h2>
          <ol>
            {content.timeline.map((stop, i) => (
              <li key={i}>
                <h3>{stop.title}</h3>
                <p>{stop.description}</p>
                {stop.duration ? <p>Timing: {stop.duration}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2>Included</h2>
        <ul>
          {content.included.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Not included</h2>
        <ul>
          {content.excluded.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {content.good_to_know.length > 0 && (
        <section>
          <h2>Good to know</h2>
          <ul>
            {content.good_to_know.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {content.faqs.length > 0 && (
        <section>
          <h2>Frequently asked questions</h2>
          {content.faqs.map((faq) => (
            <div key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </section>
      )}

      <p>
        Tell us when you book and we&apos;ll build Salah breaks into the day where
        practical.
      </p>

      <p>
        <a href={`${SITE}/book?tour=${slug}`}>Book {content.display_name}</a>
      </p>
    </article>
  )
}

function HomePrerender() {
  const fromPrice = siteLowestFromLabel()

  return (
    <article data-prerender="body">
      <header>
        <p>
          {GUIDE_REGISTRATION_LABEL} · Muslim-friendly private tours
        </p>
        <h1>Private &amp; Muslim-Friendly Tours of Cape Town</h1>
        <p>Private Journeys, Thoughtfully Guided.</p>
        <p>Relaxed, cultural, and scenic experiences with a qualified local guide</p>
        <p>{fromPrice}</p>
      </header>

      <section>
        <h2>About {BUSINESS_NAME}</h2>
        <p>
          {BUSINESS_NAME} offers private, Muslim-friendly tours of Cape Town and
          the Western Cape. We focus on relaxed pacing, cultural sensitivity, and
          showing you the best of the region in a way that respects your values
          and preferences.
        </p>
        <ul>
          <li>
            <strong>Private tours</strong> — Your group only, no strangers.
          </li>
          <li>
            <strong>Family-friendly pacing</strong> — No rush; time for rest and
            reflection.
          </li>
          <li>
            <strong>Cultural sensitivity</strong> — Halal-friendly options and
            awareness of your needs.
          </li>
          <li>
            <strong>Pre-booked only</strong> — All tours are arranged in advance
            for a smooth experience.
          </li>
        </ul>
      </section>

      <section>
        <h2>Private experiences</h2>
        <ul>
          {EXPERIENCE_SLUGS.map((slug) => {
            const content = EXPERIENCE_DEFAULTS[slug]
            if (!content) return null
            return (
              <li key={slug}>
                <a href={`${SITE}/experience/${slug}`}>{content.display_name}</a>
                {' — '}
                {content.short_description} · {durationForSlug(slug, content)} ·{' '}
                {fromPriceForSlug(slug)}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          WhatsApp: {BUSINESS_PHONE} · Email: {BUSINESS_EMAIL}
        </p>
        <p>
          <a href={`${SITE}/book`}>Book a private tour online</a>
        </p>
      </section>
    </article>
  )
}

function BookPrerender() {
  return (
    <article data-prerender="body">
      <h1>Book your private experience</h1>
      <p>Live pricing · guest checkout with Yoco · sign in optional</p>
      <p>
        Choose a private Cape Town experience, select your date and vehicle, and
        pay securely online. Muslim-friendly, halal-aware pacing available on
        request for relevant tours.
      </p>
      <section>
        <h2>Experiences available to book</h2>
        <ul>
          {EXPERIENCE_SLUGS.map((slug) => {
            const content = EXPERIENCE_DEFAULTS[slug]
            if (!content) return null
            return (
              <li key={slug}>
                <a href={`${SITE}/book?tour=${slug}`}>{content.display_name}</a>
                {' — '}
                {durationForSlug(slug, content)} · {fromPriceForSlug(slug)}
              </li>
            )
          })}
        </ul>
      </section>
    </article>
  )
}

function GalleryPrerender() {
  return (
    <article data-prerender="body">
      <h1>Gallery</h1>
      <p>Places we visit on our tours.</p>
      <ul>
        {galleryImages.map((img, i) => (
          <li key={i}>
            <img src={img.src} alt={img.alt} />
          </li>
        ))}
      </ul>
    </article>
  )
}

function renderSpaPage(location: string, Page: React.ComponentType) {
  const markup = renderToStaticMarkup(
    <MemoryRouter initialEntries={[location]}>
      <SsrAuthProvider>
        <Page />
      </SsrAuthProvider>
    </MemoryRouter>
  )
  return `<div data-prerender="body">${markup}</div>`
}

export function renderRouteBody(routePath: string): string {
  let element: React.ReactElement | null = null

  if (routePath === '/') {
    element = <HomePrerender />
  } else if (routePath === '/book') {
    element = <BookPrerender />
  } else if (routePath === '/gallery') {
    element = <GalleryPrerender />
  } else if (routePath === '/terms') {
    return renderSpaPage('/terms', TermsPage)
  } else if (routePath === '/privacy') {
    return renderSpaPage('/privacy', PrivacyPage)
  } else if (routePath === '/cookies') {
    return renderSpaPage('/cookies', CookiesPage)
  } else if (routePath.startsWith('/experience/')) {
    const slug = routePath.replace('/experience/', '')
    element = <ExperiencePrerender slug={slug} />
  }

  if (!element) return ''
  return renderToStaticMarkup(element)
}

/** Minimal crawler-visible body for static 404.html (no homepage hero or JSON-LD). */
export function renderNotFoundPrerenderBody(): string {
  return renderToStaticMarkup(
    <article data-prerender="body">
      <h1>Page not found</h1>
      <p>This page does not exist on {BUSINESS_NAME}.</p>
      <p>
        <a href={`${SITE}/`}>Home</a> · <a href={`${SITE}/book`}>Book</a>
      </p>
    </article>
  )
}

export function allPrerenderBodyPaths(): string[] {
  return [
    '/',
    '/book',
    '/gallery',
    '/terms',
    '/privacy',
    '/cookies',
    ...EXPERIENCE_SLUGS.map((slug) => `/experience/${slug}`),
  ]
}

/** Used by llms.txt generator */
export function tourSummaryLines(): string[] {
  return EXPERIENCE_SLUGS.map((slug) => {
    const content = EXPERIENCE_DEFAULTS[slug]
    const tour = getFloorTour(slug)
    const cents = tour ? startingFromCents(tour, FLOOR_VEHICLES, 1) : 0
    const duration =
      slug === 'hermanus'
        ? HERMANUS_DURATION_LABEL
        : content?.duration_label || ''
    const priceLabel =
      slug === 'hermanus'
        ? `From ${formatZarComma(cents)}`
        : formatFromOneGuest(cents)
    return `- ${content?.display_name}: ${SITE}/experience/${slug} (${priceLabel}, ${duration})`
  })
}
