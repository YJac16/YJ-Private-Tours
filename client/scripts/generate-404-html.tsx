import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import NotFoundPage from '../src/pages/NotFoundPage.tsx'
import { SsrAuthProvider } from '../src/lib/auth.tsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const INDEX = path.join(DIST, 'index.html')

function inject404Meta(html: string) {
  let out = html.replace(
    /<title>[^<]*<\/title>/i,
    '<title>Page not found — KhayrCape Experiences</title>'
  )
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="description" content="This page does not exist on KhayrCape Experiences." />'
  )
  if (!/name="robots"/i.test(out)) {
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

  const body = renderToStaticMarkup(
    <MemoryRouter initialEntries={['/404']}>
      <SsrAuthProvider>
        <NotFoundPage />
      </SsrAuthProvider>
    </MemoryRouter>
  )

  let shell = fs.readFileSync(INDEX, 'utf8')
  shell = inject404Meta(shell)
  shell = shell.replace(
    '<div id="root"></div>',
    `<div id="root" data-prerender="1">${body}</div>`
  )

  fs.writeFileSync(path.join(DIST, '404.html'), shell, 'utf8')
  console.log('generate-404-html: wrote client/dist/404.html')
}

main()
