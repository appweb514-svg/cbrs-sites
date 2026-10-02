import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import config from '@/payload.config'

let payload: Payload
let imageId: number
let dossier: string
beforeAll(async () => {
  payload = await getPayload({ config })
  dossier = mkdtempSync(join(tmpdir(), 'cbrs-pictogramme-'))
  const fichier = join(dossier, 'pictogramme.png')
  writeFileSync(fichier, await sharp({ create: { width: 24, height: 24, channels: 3, background: '#123456' } }).png().toBuffer())
  const image = await payload.create({ collection: 'media', data: { alt: 'Pictogramme de test' }, filePath: fichier })
  imageId = image.id
})
afterAll(async () => {
  if (imageId) await payload.delete({ collection: 'media', id: imageId })
  if (dossier) rmSync(dossier, { recursive: true, force: true })
})
describe('Pictogrammes personnalisés Formation', () => {
  it('conserve l’image, la publie et la restaure avec la carte', async () => {
    const enregistre = await payload.updateGlobal({ slug: 'formation', data: {
      cartes: [{ titre: 'Nouvelle activité', icone: '01_aquagym.png', image: imageId }],
    }, depth: 0 })
    expect(enregistre.cartes?.[0]).toMatchObject({ image: imageId })
    const publicDoc = await payload.findGlobal({ slug: 'formation', depth: 1, overrideAccess: false })
    expect(publicDoc.cartes?.[0]).toMatchObject({ image: { id: imageId, url: expect.stringContaining('pictogramme') } })
    const versions = await payload.findGlobalVersions({ slug: 'formation', sort: '-createdAt', limit: 20 })
    const precedente = versions.docs.find((v) => v.version.cartes?.[0]?.titre === 'Nouvelle activité')
    expect(precedente).toBeDefined()
    await payload.updateGlobal({ slug: 'formation', data: { cartes: [{ titre: 'Sans image', image: null }] } })
    const sansImage = await payload.findGlobal({ slug: 'formation' })
    expect(sansImage.cartes?.[0]).toMatchObject({ image: null })
    await payload.restoreGlobalVersion({ slug: 'formation', id: precedente!.id, depth: 0 })
    const restaure = await payload.findGlobal({ slug: 'formation', depth: 0 })
    expect(restaure.cartes?.[0]).toMatchObject({ titre: 'Nouvelle activité', image: imageId })
  })
})
