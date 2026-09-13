import { useEffect } from 'react'

type Props = {
  data: Record<string, unknown> | Array<Record<string, unknown>>
  id?: string
}

function normalizeBlocks(
  data: Record<string, unknown> | Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return Array.isArray(data) ? data : [data]
}

export default function JsonLd({ data, id = 'page-jsonld' }: Props) {
  useEffect(() => {
    const blocks = normalizeBlocks(data)
    const scripts: HTMLScriptElement[] = []

    blocks.forEach((block, index) => {
      const scriptId = `${id}-${index}`
      let el = document.getElementById(scriptId) as HTMLScriptElement | null
      if (!el) {
        el = document.createElement('script')
        el.id = scriptId
        el.type = 'application/ld+json'
        document.head.appendChild(el)
      }
      el.textContent = JSON.stringify(block)
      scripts.push(el)
    })

    return () => {
      scripts.forEach((el) => el.remove())
    }
  }, [data, id])

  return null
}
