import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'

import { COULEURS_ORIGINE, INTENSITE_TEINTE_ORIGINE } from '@/couleurs'
import config from '@/payload.config'
import type { Media } from '@/payload-types'

let payload: Payload
let image: Media

beforeAll(async () => {
  payload = await getPayload({ config })
  const dossier = mkdtempSync(join(tmpdir(), 'cbrs-apparence-'))
  const fichier = join(dossier, 'entete.png')
  writeFileSync(
    fichier,
    await sharp({ create: { width: 48, height: 24, channels: 3, background: 'rgb(10, 50, 115)' } })
      .png()
      .toBuffer(),
  )
  image = await payload.create({ collection: 'media', data: { alt: 'Image d’en-tête de test' }, filePath: fichier })
})

describe('Apparence — en-tête des pages', () => {
  it('enregistre l’image, la teinte et l’intensité', async () => {
    const apparence = await payload.updateGlobal({
      slug: 'apparence',
      data: { imageEnTete: image.id, teinteEnTete: '#145c75', intensiteTeinte: 60 },
      depth: 0,
    })
    expect(apparence.imageEnTete).toBe(image.id)
    expect(apparence.teinteEnTete).toBe('#145c75')
    expect(apparence.intensiteTeinte).toBe(60)

    const relu = await payload.findGlobal({ slug: 'apparence', depth: 0 })
    expect(relu.imageEnTete).toBe(image.id)
    expect(relu.intensiteTeinte).toBe(60)
  })

  it('refuse une intensité hors bornes (0 à 100)', async () => {
    // Payload remplace le message de surface par « Le champ suivant n’est pas valide : <libellé> » :
    // le message du champ se lit dans erreur.data.errors.
    const messages = async (intensiteTeinte: number): Promise<string[]> => {
      try {
        await payload.updateGlobal({ slug: 'apparence', data: { intensiteTeinte } })
        return []
      } catch (error) {
        const details = (error as { data?: { errors?: { message?: string }[] } }).data?.errors ?? []
        return details.map((detail) => detail.message ?? '')
      }
    }

    expect(await messages(101)).toEqual([expect.stringMatching(/pourcentage/i)])
    expect(await messages(-1)).toEqual([expect.stringMatching(/pourcentage/i)])
    const relu = await payload.findGlobal({ slug: 'apparence', depth: 0 })
    expect(relu.intensiteTeinte).toBe(60)
  })

  it('refuse une teinte trop claire pour le texte blanc', async () => {
    await expect(
      payload.updateGlobal({ slug: 'apparence', data: { teinteEnTete: '#ffee00' } }),
    ).rejects.toThrow()
  })

  it('remet l’en-tête d’origine avec « valeursOrigine »', async () => {
    await payload.updateGlobal({
      slug: 'apparence',
      data: { enTetes: [{ page: '/galerie', titre: 'Nos photos' }] },
    })
    const origine = await payload.updateGlobal({ slug: 'apparence', data: { valeursOrigine: true }, depth: 0 })
    expect(origine.imageEnTete).toBeNull()
    expect(origine.teinteEnTete).toBe(COULEURS_ORIGINE.teinteEnTete)
    expect(origine.intensiteTeinte).toBe(INTENSITE_TEINTE_ORIGINE)
    expect(origine.enTetes).toEqual([])
    expect(origine.valeursOrigine).toBe(false)
  })

  it('est lisible par le visiteur anonyme', async () => {
    const apparence = await payload.findGlobal({ slug: 'apparence', overrideAccess: false, depth: 0 })
    expect(apparence.teinteEnTete).toBe(COULEURS_ORIGINE.teinteEnTete)
    expect(apparence.intensiteTeinte).toBe(INTENSITE_TEINTE_ORIGINE)
  })
})
