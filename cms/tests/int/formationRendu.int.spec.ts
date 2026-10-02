// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const source = readFileSync('../site3/cms-client.js', 'utf8')
async function rendu(carte: Record<string, unknown>) {
  document.documentElement.innerHTML = `<head><meta name="cbrs-cms-url" content="https://cms.test"></head><body><h1 data-cbrs-formation="parcoursTitre"></h1><div data-cbrs-formation-cartes></div></body>`
  vi.stubGlobal('fetch', async (url: string) => ({ ok: true, json: async () => url.includes('/formation') ? { cartes: [carte] } : {} }))
  new Function(source)()
  await (window as unknown as { CBRSCms: { ready: Promise<unknown> } }).CBRSCms.ready
  return document
}
afterEach(() => vi.unstubAllGlobals())

describe('Formation publique : choix de l’image', () => {
  it('préfère la photo téléversée et résout son adresse CMS', async () => {
    const dom = await rendu({ titre: 'Atelier', icone: '01_aquagym.png', image: { url: '/api/media/file/atelier.png' } })
    expect(dom.querySelector('img')?.src).toBe('https://cms.test/api/media/file/atelier.png')
  })
  it('garde le pictogramme d’origine sans photo utilisable', async () => {
    for (const image of [null, 123, { url: 'javascript:alert(1)' }]) {
      const dom = await rendu({ titre: 'Aquagym', icone: '01_aquagym.png', image })
      expect(dom.querySelector('img')?.src).toContain('01_aquagym.png?')
    }
  })
  it('affiche une carte sans pictogramme quand aucun fichier n’est choisi', async () => {
    const dom = await rendu({ titre: 'Atelier', image: null })
    expect(dom.querySelector('img')).toBeNull()
    expect(dom.querySelector('h3')?.textContent).toBe('Atelier')
  })
})
