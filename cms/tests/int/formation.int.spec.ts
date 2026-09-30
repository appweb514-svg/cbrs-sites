import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

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

  it('enregistre les fiches PDF et les textes, et applique les valeurs par défaut aux champs non saisis', async () => {
    const formation = await payload.updateGlobal({
      slug: 'formation',
      data: {
        parcoursTitre: 'Parcours e2e',
        ficheFia: pdf.id,
        carteAg: { titre: 'Aquagym du soir' },
      },
      depth: 0,
    })
    expect(formation.parcoursTitre).toBe('Parcours e2e')
    expect(formation.ficheFia).toBe(pdf.id)
    expect(formation.etape1?.titre).toBe('Connaître la FFRS')
    expect(formation.carteAg?.titre).toBe('Aquagym du soir')
    expect(formation.carteAg?.sousTitre).toBe('M2-AGEF — Gymnastique Aquatique')
    expect(formation.ctaBouton).toBe('Nous contacter')

    const relu = await payload.findGlobal({ slug: 'formation', depth: 1 })
    const fiche = relu.ficheFia
    expect(typeof fiche === 'object' && fiche !== null && fiche.url).toContain('fiche-fia.pdf')
    expect(relu.parcoursTitre).toBe('Parcours e2e')
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
