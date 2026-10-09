// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const source = readFileSync('../site3/cms-client.js', 'utf8')
async function rendu(corps: string, globals: Record<string, unknown>) {
  document.documentElement.innerHTML = `<head><meta name="cbrs-cms-url" content="https://cms.test"></head><body>${corps}</body>`
  vi.stubGlobal('fetch', async (url: string) => {
    const slug = Object.keys(globals).find((s) => url.includes(`/api/globals/${s}`))
    return { ok: true, json: async () => (slug ? globals[slug] : {}) }
  })
  new Function(source)()
  await (window as unknown as { CBRSCms: { ready: Promise<unknown> } }).CBRSCms.ready
  return document
}
afterEach(() => vi.unstubAllGlobals())

const h2 = '<h2 data-cbrs-titre="nousContacter">Nous <span class="x">contacter</span></h2>'

describe('Titres des pages', () => {
  it('met le mot choisi en italique bleu (dernière occurrence)', async () => {
    const dom = await rendu(h2, { titres: { nousContacter: { titre: 'Contact : nous contacter', motMisEnValeur: 'contacter' } } })
    const titre = dom.querySelector('h2')!
    expect(titre.textContent).toBe('Contact : nous contacter')
    expect(titre.querySelector('span')?.textContent).toBe('contacter')
    expect(titre.querySelector('span')?.className).toBe('text-cbrs-blue font-serif-italic')
  })
  it('accepte une casse différente', async () => {
    const dom = await rendu(h2, { titres: { nousContacter: { titre: 'Nous Contacter', motMisEnValeur: 'contacter' } } })
    expect(dom.querySelector('h2 span')?.textContent).toBe('Contacter')
  })
  it('affiche le titre sans accent si le mot est absent ou vide', async () => {
    for (const mot of ['absent', '', null]) {
      const dom = await rendu(h2, { titres: { nousContacter: { titre: 'Nous écrire', motMisEnValeur: mot } } })
      expect(dom.querySelector('h2')?.textContent).toBe('Nous écrire')
      expect(dom.querySelector('h2 span')).toBeNull()
    }
  })
  it('n’interprète jamais le HTML du CMS', async () => {
    const dom = await rendu(h2, { titres: { nousContacter: { titre: '<img src=x onerror=alert(1)> test', motMisEnValeur: 'test' } } })
    expect(dom.querySelector('h2 img')).toBeNull()
    expect(dom.querySelector('h2')?.textContent).toBe('<img src=x onerror=alert(1)> test')
  })
  it('garde le texte livré si les champs sont vides', async () => {
    const dom = await rendu(`${h2}<p data-cbrs-titre-intro="nousContacter">Intro</p>`, { titres: { nousContacter: { titre: '', introduction: ' ' } } })
    expect(dom.querySelector('h2')?.textContent).toBe('Nous contacter')
    expect(dom.querySelector('p')?.textContent).toBe('Intro')
  })
  it('remplace sur-titre et introduction', async () => {
    const dom = await rendu(
      '<p data-cbrs-titre-surtitre="a">S</p><h2 data-cbrs-titre="a">T</h2><p data-cbrs-titre-intro="a">I</p>',
      { titres: { a: { surtitre: 'Nouveau', titre: 'Titre', introduction: 'Nouvelle intro' } } },
    )
    expect(dom.querySelector('p')?.textContent).toBe('Nouveau')
    expect(dom.querySelectorAll('p')[1]?.textContent).toBe('Nouvelle intro')
  })
  it('met en valeur le mot du titre du parcours Formation', async () => {
    const dom = await rendu('<h2 data-cbrs-formation="parcoursTitre" data-cbrs-formation-mot="parcoursMotMisEnValeur">x</h2>', {
      formation: { parcoursTitre: 'Devenir animateur vous tente ?', parcoursMotMisEnValeur: 'animateur' },
    })
    expect(dom.querySelector('h2 span')?.textContent).toBe('animateur')
  })
})
