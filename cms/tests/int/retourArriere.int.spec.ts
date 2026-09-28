import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
let dossier: string

// Type local : le typage publié de la configuration nettoyée ne reflète pas le chemin réel
// des composants (collections : `admin.components.edit`, globals : `admin.components.elements`).
type AdminAvecBouton = {
  admin?: { components?: Record<string, { beforeDocumentControls?: unknown[] }> }
}

const boutonDans = (entite: unknown, emplacement: 'edit' | 'elements'): boolean =>
  ((entite as AdminAvecBouton).admin?.components?.[emplacement]?.beforeDocumentControls ?? []).some(
    (element) => JSON.stringify(element).includes('RetourArriere'),
  )

// Appelle le droit « lire les versions » avec un utilisateur donné.
const permisVersions = (entite: unknown, user: unknown): unknown => {
  const acces = (entite as { access?: { readVersions?: unknown } }).access?.readVersions
  return typeof acces === 'function'
    ? (acces as (args: { req: { user: unknown } }) => unknown)({ req: { user } })
    : undefined
}

beforeAll(async () => {
  payload = await getPayload({ config })
  dossier = mkdtempSync(join(tmpdir(), 'cbrs-retour-'))
  // PDF minimal valide : en-tête « %PDF- », table « xref » et « %%EOF » exigés par Payload.
  const pdf = (marque: string) =>
    `%PDF-1.4\n%${marque}\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF\n`
  writeFileSync(join(dossier, 'version-1.pdf'), pdf('Version 1'))
  writeFileSync(join(dossier, 'version-2.pdf'), pdf('Version 2'))
})

describe('Retour en arrière', () => {
  // Le bouton n'apparaît que si l'historique est activé : il doit l'être partout.
  it('active l’historique et le bouton sur toutes les fiches', async () => {
    const cfg = await config
    // Les collections internes de Payload (payload-kv, payload-migrations…) ne sont pas des fiches.
    const collections = cfg.collections.filter((collection) => !collection.slug.startsWith('payload-'))

    expect(collections).toHaveLength(9)

    for (const collection of collections) {
      expect(collection.versions, collection.slug).toBeTruthy()
      expect(collection.access?.readVersions, collection.slug).toBeTruthy()
      expect(boutonDans(collection, 'edit'), collection.slug).toBe(true)
    }

    for (const global of cfg.globals) {
      expect(global.versions, global.slug).toBeTruthy()
      expect(global.access?.readVersions, global.slug).toBeTruthy()
      expect(boutonDans(global, 'elements'), global.slug).toBe(true)
    }
  })

  // Sans `readVersions`, Payload masque l'historique : le bouton ne doit pas rester sans effet.
  it('ouvre l’historique aux bénévoles qui voient la section', async () => {
    const cfg = await config
    const bureau = cfg.collections.find((collection) => collection.slug === 'membres-bureau')!
    const flash = cfg.globals.find((global) => global.slug === 'flash-info')!
    const benevole = {
      estAdministrateur: false,
      roles: [{ id: 1, permissions: [{ actions: ['voir'], section: 'membres-bureau' }] }],
    }

    expect(permisVersions(bureau, benevole)).toBe(true)
    expect(permisVersions(flash, benevole)).toBe(false)
    expect(
      permisVersions(flash, {
        ...benevole,
        roles: [{ id: 1, permissions: [{ actions: ['voir'], section: 'flash-info' }] }],
      }),
    ).toBe(true)
  })

  // Même requête que le bouton : les deux dernières versions, la plus récente en tête.
  it('restaure la version précédente d’une fiche', async () => {
    const cree = await payload.create({
      collection: 'membres-bureau',
      data: { fonction: 'Président', nom: 'Test retour' },
    })
    await payload.update({ collection: 'membres-bureau', id: cree.id, data: { fonction: 'Trésorier' } })

    const versions = await payload.findVersions({
      collection: 'membres-bureau',
      limit: 2,
      sort: '-updatedAt',
      where: { parent: { equals: cree.id } },
    })
    expect(versions.docs).toHaveLength(2)

    await payload.restoreVersion({ collection: 'membres-bureau', id: versions.docs[1]!.id })

    const apres = await payload.findByID({ collection: 'membres-bureau', id: cree.id })
    expect(apres.fonction).toBe('Président')
    await payload.delete({ collection: 'membres-bureau', id: cree.id })
  })

  it('restaure les informations d’un document sans remplacer le fichier en place', async () => {
    const document = await payload.create({
      collection: 'documents',
      data: { categorie: 'autre', remplaceLienOfficiel: 'aucun', titre: 'Document test' },
      filePath: join(dossier, 'version-1.pdf'),
      overrideAccess: true,
    })
    const remplace = await payload.update({
      collection: 'documents',
      data: { titre: 'Document modifié' },
      filePath: join(dossier, 'version-2.pdf'),
      id: document.id,
      overrideAccess: true,
    })

    const versions = await payload.findVersions({
      collection: 'documents',
      limit: 2,
      sort: '-updatedAt',
      where: { parent: { equals: document.id } },
    })
    await payload.restoreVersion({ collection: 'documents', id: versions.docs[1]!.id })

    const apres = await payload.findByID({ collection: 'documents', id: document.id })
    expect(apres.titre).toBe('Document test')
    // Le fichier en place n'est pas remplacé par celui de la version restaurée (fichier supprimé).
    expect(apres.filename).toBe(remplace.filename)
    await payload.delete({ collection: 'documents', id: document.id, overrideAccess: true })
  })

  it('restaure la version précédente d’une page de réglages', async () => {
    await payload.updateGlobal({ slug: 'flash-info', data: { message: 'Message de test' } })
    await payload.updateGlobal({ slug: 'flash-info', data: { message: 'Message modifié' } })

    const versions = await payload.findGlobalVersions({ limit: 2, slug: 'flash-info', sort: '-updatedAt' })
    expect(versions.docs).toHaveLength(2)

    await payload.restoreGlobalVersion({ id: versions.docs[1]!.id, slug: 'flash-info' })

    const apres = await payload.findGlobal({ slug: 'flash-info' })
    expect(apres.message).toBe('Message de test')
  })
})
