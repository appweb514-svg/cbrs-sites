// Usage : node check-cls.mjs [baseUrl]   (serveur statique à la racine du dépôt)
import { chromium } from 'playwright-core'

const base = process.argv[2] || 'http://127.0.0.1:8092'
const pages = [
  'index.html', 'activites.html', 'activite.html?id=07', 'activite.html?id=17', 'planning.html',
  'adhesion.html', 'formation.html', 'sorties-voyages.html', 'sortie.html?id=dieppe',
  'evenement.html?id=olympiades-seniors', 'galerie.html', 'liens-utiles.html', 'contact.html',
  'statuts.html', 'mentions-legales.html', 'conditions-utilisation.html',
]
const viewports = { bureau: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } }
const LIMIT = 0.1

const browser = await chromium.launch({ channel: 'chrome' })
let failures = 0
for (const [name, viewport] of Object.entries(viewports)) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(() => {
    window.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value
    }).observe({ type: 'layout-shift', buffered: true })
    try { localStorage.setItem('cbrs-cookie-consent-v1', JSON.stringify({ version: 1, necessary: true, external: false })) } catch {}
  })
  for (const path of pages) {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      await page.goto(`${base}/site3/${path}`, { waitUntil: 'load', timeout: 20000 })
    } catch (error) {
      errors.push(`chargement : ${error.message.split('\n')[0]}`)
    }
    await page.waitForTimeout(1200)
    const cls = await page.evaluate(() => window.__cls)
    const ok = cls < LIMIT && errors.length === 0
    if (!ok) failures++
    console.log(`${ok ? 'OK ' : 'KO '} ${name.padEnd(6)} CLS ${cls.toFixed(3)}  ${path}${errors.length ? '  erreurs: ' + errors.join(' | ') : ''}`)
    await page.close()
  }
  await context.close()
}
await browser.close()
console.log(failures ? `${failures} page(s) au-dessus du seuil ${LIMIT} ou en erreur` : `Toutes les pages sous le seuil CLS ${LIMIT}, sans erreur`)
process.exit(failures ? 1 : 0)
