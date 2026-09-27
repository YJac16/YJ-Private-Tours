import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderNotFoundPrerenderBody } from '../src/seo/prerender/renderRouteBody.tsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const INDEX = path.join(DIST, 'index.html')

function stripHomeSeoArtifacts(html: string) {
  let out = html
  out = out.replace(/\s*<link\s+rel="canonical"[^>]*>\s*/gi, '\n')
  out = out.replace(
    /\s*<script type="application\/ld\+json" data-prerender="1">[\s\S]*?<\/script>/gi,
    ''
  )
  return out
}

function inject404Meta(html: string) {
  let out = html.replace(
    /<title>[^<]*<\/title>/i,
    '<title>Page not found — KhayrCape Experiences</title>'
  )
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="description" content="This page does not exist on KhayrCape Experiences." />'
  )
  if (/<meta\s+name="robots"/i.test(out)) {
    out = out.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      '<meta name="robots" content="noindex, nofollow" />'
    )
  } else {
    out = out.replace(
      '</head>',
      '    <meta name="robots" content="noindex, nofollow" />\n  </head>'
    )
  }
  return out
}

function main() {
  if (!fs.existsSync(INDEX)) {
    console.error('generate-404-html: client/dist/index.html missing')
    process.exit(1)
  }

  const body = renderNotFoundPrerenderBody()

  let shell = fs.readFileSync(INDEX, 'utf8')
  shell = stripHomeSeoArtifacts(shell)
  shell = inject404Meta(shell)
  shell = shell.replace(
    /<div id="root"[^>]*>[\s\S]*?<\/div>/,
    `<div id="root" data-prerender="1">${body}</div>`
  )

  fs.writeFileSync(path.join(DIST, '404.html'), shell, 'utf8')
  console.log('generate-404-html: wrote client/dist/404.html')
}

main()
