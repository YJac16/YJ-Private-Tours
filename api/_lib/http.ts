import type { VercelRequest, VercelResponse } from '@vercel/node'

export function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof req.body === 'string') {
      resolve(req.body)
      return
    }
    if (Buffer.isBuffer(req.body)) {
      resolve(req.body.toString('utf8'))
      return
    }
    if (req.body && typeof req.body === 'object') {
      // Body already parsed — signature verify needs original bytes when possible.
      resolve(JSON.stringify(req.body))
      return
    }
    let data = ''
    req.on('data', (chunk) => {
      data += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export function readJson(req: VercelRequest): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      resolve(req.body as Record<string, unknown>)
      return
    }
    readRawBody(req)
      .then((data) => {
        try {
          resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {})
        } catch (e) {
          reject(e)
        }
      })
      .catch(reject)
  })
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader('Allow', allowed.join(', '))
  return res.status(405).json({ error: 'Method not allowed' })
}
