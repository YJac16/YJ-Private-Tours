/**
 * Home FAQ custom-tours link uses a readable label, not the raw path.
 * Run: cd client && NODE_PATH=./node_modules npx tsx --tsconfig tsconfig.prerender.json ../scripts/home-faq-link-unit.ts
 */
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import HomeFaq from '../client/src/components/HomeFaq.tsx'
import { HOME_CUSTOM_TOUR_FAQ } from '../client/src/data/customToursCopy.ts'
import { SITE } from '../client/src/seo/siteConfig.ts'
import { buildFaqJsonLd } from '../client/src/seo/routes.ts'
import { renderRouteBody } from '../client/src/seo/prerender/renderRouteBody.tsx'

const label = HOME_CUSTOM_TOUR_FAQ.answerLinkLabel
assert.equal(label, 'our custom tours page')
assert.equal(label.includes('/'), false)

const visible = `${HOME_CUSTOM_TOUR_FAQ.answerBeforeLink}${label}${HOME_CUSTOM_TOUR_FAQ.answerAfterLink}`
assert.equal(
  visible,
  'Yes. Custom private tours are available on request and quoted individually — not through the standard online package checkout. Visit our custom tours page to see how it works and message us on WhatsApp.'
)
assert.equal(visible.includes('/custom-tours'), false)

assert.equal(
  HOME_CUSTOM_TOUR_FAQ.answer,
  `${HOME_CUSTOM_TOUR_FAQ.answerBeforeLink}${label} (${SITE}/custom-tours)${HOME_CUSTOM_TOUR_FAQ.answerAfterLink}`
)

const ui = renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(HomeFaq))
)
assert.match(ui, /href="\/custom-tours"/)
assert.match(ui, />our custom tours page</)
assert.doesNotMatch(ui, />\/custom-tours</)

const prerender = renderRouteBody('/')
assert.match(
  prerender,
  new RegExp(
    `<a href="${SITE}/custom-tours">our custom tours page</a>`
  )
)
assert.doesNotMatch(prerender, />\/custom-tours</)

const faqLd = buildFaqJsonLd([HOME_CUSTOM_TOUR_FAQ])
const answer = (
  faqLd.mainEntity as Array<{ acceptedAnswer: { text: string } }>
)[0].acceptedAnswer.text
assert.match(answer, /Visit our custom tours page \(https:\/\/khayrcapeexperiences\.com\/custom-tours\)/)
assert.doesNotMatch(answer, /Visit https:\/\/khayrcapeexperiences\.com\/custom-tours/)

console.log('home-faq-link-unit: ok')
