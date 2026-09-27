import { PRIMARY_SITE_NAV } from '../primaryNav'

/** Crawler-visible nav inside prerender HTML (cleared before React hydrate). */
export default function PrerenderSiteNav() {
  return (
    <nav data-prerender="nav" aria-label="Site">
      <ul>
        {PRIMARY_SITE_NAV.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
