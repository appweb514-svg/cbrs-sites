import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { MAX_CARTES, MAX_ETAPES } from '@/globals/Formation'
import config from '@/payload.config'
import type { Document, User } from '@/payload-types'

let payload: Payload
let pdf: Document
let redacteur: User
let sansDroit: User

const createUser = async (email: string, nom: string, roles: number[], estAdministrateur = false) => {
  const user = await payload.create({
    collection: 'users',
    data: { email, nom, roles, estAdministrateur, password: 'motdepasse-test' },
  })
  // Comme à la connexion (auth.depth = 1) : rôles peuplés.
  return payload.findByID({ collection: 'users', id: user.id, depth: 1 })
}

const withUser = (user: User) => ({ user: { ...user, collection: 'users' as const }, overrideAccess: false })

beforeAll(async () => {
  payload = await getPayload({ config: await config })

  const dossier = mkdtempSync(join(tmpdir(), 'cbrs-formation-'))
  const chemin = join(dossier, 'fiche-fia.pdf')
  mkdirSync(join(process.cwd(), 'documents'), { recursive: true })
  // Repartir d’un dépôt propre : un test interrompu peut laisser le PDF du run précédent.
  for (const fichier of readdirSync(join(process.cwd(), 'documents')).filter((f) => f.startsWith('fiche-fia'))) {
    rmSync(join(process.cwd(), 'documents', fichier), { force: true })
  }
  writeFileSync(
    chemin,
    Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF\n',
    ),
  )
  pdf = await payload.create({
    collection: 'documents',
    data: { titre: 'Fiche FIA de test', categorie: 'autre', remplaceLienOfficiel: 'aucun' },
    filePath: chemin,
    draft: false,
  })

  const roleRedacteur = await payload.create({
    collection: 'roles',
    data: {
      nom: 'Responsable formation',
      description: 'Gère la page Formation.',
      permissions: [{ section: 'formation', actions: ['voir', 'modifier'] }],
    },
  })
  const roleSansDroit = await payload.create({
    collection: 'roles',
    data: {
      nom: 'Lecteur des tarifs',
      description: 'Ne gère pas la page Formation.',
      permissions: [{ section: 'tarifs', actions: ['voir'] }],
    },
  })

  redacteur = await createUser('formation@test.local', 'Rédacteur formation', [roleRedacteur.id])
  sansDroit = await createUser('tarifs@test.local', 'Lecteur tarifs', [roleSansDroit.id])
})

describe('Global Formation', () => {
  afterAll(async () => {
    if (pdf) await payload.delete({ collection: 'documents', id: pdf.id, overrideAccess: true })
  })

  it('fournit par défaut les 3 étapes et les 6 cartes du site, avec les PDF livrés', async () => {
    const formation = await payload.findGlobal({ slug: 'formation', depth: 0 })
    expect(formation.etapes?.map((etape) => etape.titre)).toEqual([
      'Connaître la FFRS',
      'Formation Initiale des Animateurs (FIA)',
      'Formation par activité (M2)',
    ])
    expect(formation.etapes?.[1]?.ficheSite).toBe('docs/FFRS_Formation_FIA_Aout-2025.pdf')
    expect(formation.cartes).toHaveLength(6)
    expect(formation.cartes?.[0]).toMatchObject({
      titre: 'Aquagym',
      icone: '01_aquagym.png',
      ficheSite: 'docs/FFRS_Formation_M2-AGEF_Aout-2025.pdf',
    })
  })

  it('enregistre des étapes et des cartes ajoutées, avec leur fiche PDF', async () => {
    const formation = await payload.updateGlobal({
      slug: 'formation',
      data: {
        parcoursTitre: 'Parcours e2e',
        etapes: [
          { titre: 'Connaître la FFRS' },
          { titre: 'FIA', fiche: pdf.id, boutonLibelle: 'Voir la FIA' },
          { titre: 'M2' },
          { titre: 'Recyclage', texte: 'Tous les 5 ans.' },
        ],
        cartes: [
          { titre: 'Aquagym du soir', icone: '01_aquagym.png', fiche: pdf.id },
          { titre: 'Pickleball', sousTitre: 'M2-AC', icone: '10_pickleball.png' },
        ],
      },
      depth: 0,
    })
    expect(formation.parcoursTitre).toBe('Parcours e2e')
    expect(formation.etapes).toHaveLength(4)
    expect(formation.etapes?.[3]?.texte).toBe('Tous les 5 ans.')
    expect(formation.cartes?.map((carte) => carte.titre)).toEqual(['Aquagym du soir', 'Pickleball'])
    expect(formation.ctaBouton).toBe('Nous contacter')

    const relu = await payload.findGlobal({ slug: 'formation', depth: 1 })
    const fiche = relu.etapes?.[1]?.fiche
    expect(typeof fiche === 'object' && fiche !== null && fiche.url).toContain('fiche-fia.pdf')
    const ficheCarte = relu.cartes?.[0]?.fiche
    expect(typeof ficheCarte === 'object' && ficheCarte !== null && ficheCarte.filename).toContain('fiche-fia')
  })

  it(`refuse plus de ${MAX_ETAPES} étapes et plus de ${MAX_CARTES} cartes`, async () => {
    await expect(
      payload.updateGlobal({
        slug: 'formation',
        data: { etapes: Array.from({ length: MAX_ETAPES + 1 }, (_, i) => ({ titre: `Étape ${i + 1}` })) },
      }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({
        slug: 'formation',
        data: { cartes: Array.from({ length: MAX_CARTES + 1 }, (_, i) => ({ titre: `Carte ${i + 1}` })) },
      }),
    ).rejects.toThrow()
    const relu = await payload.findGlobal({ slug: 'formation', depth: 0 })
    expect(relu.etapes).toHaveLength(4)
  })

  it('est lisible sans authentification (repli du site)', async () => {
    const relu = await payload.findGlobal({ slug: 'formation', depth: 0, overrideAccess: false })
    expect(relu.parcoursTitre).toBe('Parcours e2e')
  })

  it('refuse l’enregistrement à un rôle sans le droit « Page Formation »', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'formation',
        data: { parcoursTitre: 'Modification interdite' },
        ...withUser(sansDroit),
      }),
    ).rejects.toThrow()
  })

  it('accepte l’enregistrement d’un rôle avec « Page Formation / Modifier »', async () => {
    await payload.updateGlobal({
      slug: 'formation',
      data: { parcoursTitre: 'Parcours du rédacteur' },
      ...withUser(redacteur),
    })
    const relu = await payload.findGlobal({ slug: 'formation', depth: 0 })
    expect(relu.parcoursTitre).toBe('Parcours du rédacteur')
  })
})
