// Serveur local qui applique les règles de vercel.json (redirects, fichiers, rewrites)
// pour tester le site comme en production : node tooling/serve.mjs [port]
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'))

const CMS_ORIGIN = (process.env.CBRS_CMS_ORIGIN || 'https://cbrs-cms.vercel.app').replace(/\/+$/, '')

function reecrireMeta(html) {
  return html.replace(/(<meta[^>]*name=["']cbrs-cms-url["'][^>]*content=["'])[^"']*(["'])/i, '$1/__cms$2')
}

// Convertit une source Vercel (:param, :param*, :param(regex)) en expression régulière.
function compile(source) {
  const names = []
  let pattern = ''
  let i = 0
  while (i < source.length) {
    const param = /^:([A-Za-z_]\w*)/.exec(source.slice(i))
    if (!param) {
      pattern += source[i].replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      i += 1
      continue
    }
    names.push(param[1])
    i += param[0].length
    if (source[i] === '(') {
      let depth = 0
      let j = i
      for (; j < source.length; j += 1) {
        if (source[j] === '(') depth += 1
        if (source[j] === ')' && --depth === 0) break
      }
      pattern += '(' + source.slice(i + 1, j) + ')'
      i = j + 1
    } else if (source[i] === '*') {
      pattern += '(.*)'
      i += 1
    } else {
      pattern += '([^/]+)'
    }
  }
  return { regex: new RegExp('^' + pattern + '$'), names }
}

function match(rule, pathname) {
  const { regex, names } = compile(rule.source)
  const found = regex.exec(pathname)
  if (!found) return null
  let destination = rule.destination
  names.forEach((name, index) => {
    destination = destination.replace(new RegExp(':' + name + '\\*?', 'g'), found[index + 1] ?? '')
  })
  return destination
}

function isFile(pathname) {
  const file = normalize(join(root, decodeURIComponent(pathname)))
  return file.startsWith(root) && existsSync(file) && statSync(file).isFile() ? file : null
}

// Même ordre que Vercel : redirects, puis fichiers existants, puis rewrites.
export function resolve(pathname) {
  for (const rule of config.redirects || []) {
    const location = match(rule, pathname)
    if (location) return { status: rule.permanent ? 308 : 307, location }
  }
  const direct = isFile(pathname)
  if (direct) return { status: 200, file: direct }
  for (const rule of config.rewrites || []) {
    const target = match(rule, pathname)
    if (target) {
      if (/^https?:\/\//.test(target)) return { status: 200, proxy: target }
      const file = isFile(target)
      return file ? { status: 200, file } : { status: 404 }
    }
  }
  return { status: 404 }
}

async function proxy(res, pathname, search, method) {
  const upstream = await fetch(CMS_ORIGIN + pathname + search, { method, redirect: 'manual' })
  const corps = method === 'HEAD' ? undefined : Buffer.from(await upstream.arrayBuffer())
  const entetes = { 'Content-Length': String(corps ? corps.length : Number(upstream.headers.get('content-length') || 0)) }
  const type = upstream.headers.get('content-type')
  if (type) entetes['Content-Type'] = type
  const disposition = upstream.headers.get('content-disposition')
  if (disposition) entetes['Content-Disposition'] = disposition
  res.writeHead(upstream.status, entetes)
  res.end(corps)
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8090)
  createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      if (url.pathname === '/__cms' || url.pathname.startsWith('/__cms/')) {
        return await proxy(res, url.pathname.slice('/__cms'.length) || '/', url.search, req.method)
      }
      const result = resolve(url.pathname)
      if (result.location) {
        res.writeHead(result.status, { Location: result.location + url.search })
        return res.end()
      }
      if (result.proxy) {
        const cible = new URL(result.proxy)
        return await proxy(res, cible.pathname, cible.search + url.search, req.method)
      }
      if (!result.file) {
        res.writeHead(404)
        return res.end('Introuvable')
      }
      if (result.file.endsWith('.html')) {
        const page = Buffer.from(reecrireMeta(readFileSync(result.file, 'utf8')))
        res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Content-Length': String(page.length) })
        return res.end(req.method === 'HEAD' ? undefined : page)
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(result.file)] || 'application/octet-stream' })
      createReadStream(result.file).pipe(res)
    } catch (erreur) {
      res.writeHead(502)
      res.end('CMS injoignable : ' + erreur.message)
    }
  }).listen(port, '127.0.0.1', () => console.log(`Site : http://127.0.0.1:${port}/`))
}
