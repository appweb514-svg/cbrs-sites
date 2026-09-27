import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, type Payload, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'

import { mediaRenommer } from '@/endpoints/mediaRenommer'
import config from '@/payload.config'
import type { Media, User } from '@/payload-types'

let payload: Payload
let admin: User
let photo: Media

const dossierMedia = path.resolve('media')
const handler = mediaRenommer.handler as (req: PayloadRequest) => Promise<Response>

// Requête simulée : l'endpoint n'utilise que json(), payload et user.
const appeler = (user: unknown, corps: unknown) =>
  handler({
    headers: new Headers(),
    json: async () => corps,
    payload,
    user,
  } as unknown as PayloadRequest)

beforeAll(async () => {
  payload = await getPayload({ config })
  // Un run précédent peut avoir laissé le fichier renommé sur le disque : on repart propre.
  rmSync(path.join(dossierMedia, 'nouveau-nom.png'), { force: true })

  admin = await payload.create({
    collection: 'users',
    data: { email: 'renommage@test.local', nom: 'Renommage', password: 'motdepasse-test', estAdministrateur: true },
  })

  const dossier = mkdtempSync(path.join(tmpdir(), 'cbrs-renommage-'))
  const chemin = path.join(dossier, 'photo-test.png')
  writeFileSync(
    chemin,
    await sharp({ create: { width: 800, height: 600, channels: 3, background: 'rgb(20, 90, 160)' } })
      .png()
      .toBuffer(),
  )
  photo = await payload.create({
    collection: 'media',
    data: { alt: 'Photo à renommer' },
    filePath: chemin,
    overrideAccess: true,
  })
})

describe('Renommage d’une photo', () => {
  it('renomme le fichier en conservant son extension', async () => {
    const reponse = await appeler(admin, { id: photo.id, nom: 'Nouveau nom' })
    expect(reponse.status).toBe(200)
    await expect(reponse.json()).resolves.toEqual({ filename: 'nouveau-nom.png' })

    const misAJour = await payload.findByID({ collection: 'media', id: photo.id, depth: 0, overrideAccess: true })
    expect(misAJour.filename).toBe('nouveau-nom.png')
    expect(misAJour.url).toContain('nouveau-nom.png')
    expect(existsSync(path.join(dossierMedia, 'nouveau-nom.png'))).toBe(true)

    // Les tailles sont régénérées sous le nouveau nom.
    const vignette = misAJour.sizes?.vignette
    expect(vignette?.filename).toContain('nouveau-nom')
    expect(existsSync(path.join(dossierMedia, String(vignette?.filename)))).toBe(true)
  })

  it('garde le nom et le fichier après une modification des autres champs', async () => {
    const misAJour = await payload.update({
      collection: 'media',
      id: photo.id,
      data: { alt: 'Description modifiée' },
      overrideAccess: true,
    })
    expect(misAJour.filename).toBe('nouveau-nom.png')

    const relu = await payload.findByID({ collection: 'media', id: photo.id, depth: 0, overrideAccess: true })
    expect(relu.filename).toBe('nouveau-nom.png')
    expect(relu.url).toContain('nouveau-nom.png')
    expect(existsSync(path.join(dossierMedia, 'nouveau-nom.png'))).toBe(true)
  })

  it('ignore le nom périmé que renvoie un formulaire ouvert avant le renommage', async () => {
    const misAJour = await payload.update({
      collection: 'media',
      id: photo.id,
      data: { alt: 'Description modifiée', filename: 'photo-test.png' },
      overrideAccess: true,
    })
    expect(misAJour.filename).toBe('nouveau-nom.png')

    const relu = await payload.findByID({ collection: 'media', id: photo.id, depth: 0, overrideAccess: true })
    expect(relu.filename).toBe('nouveau-nom.png')
    expect(relu.url).toContain('nouveau-nom.png')
    expect(existsSync(path.join(dossierMedia, 'nouveau-nom.png'))).toBe(true)
  })

  it('refuse un nom invalide', async () => {
    const vide = await appeler(admin, { id: photo.id, nom: '?!.' })
    expect(vide.status).toBe(400)

    const tropLong = await appeler(admin, { id: photo.id, nom: 'a'.repeat(81) })
    expect(tropLong.status).toBe(400)
  })

  it('refuse un visiteur sans connexion', async () => {
    const reponse = await appeler(null, { id: photo.id, nom: 'autre-nom' })
    expect(reponse.status).toBe(401)
  })

  it('refuse un bénévole sans droit « modifier » sur les photos', async () => {
    const role = await payload.create({ collection: 'roles', data: { nom: 'Sans droit photos', permissions: [] } })
    const benevole = await payload.create({
      collection: 'users',
      data: { email: 'sans-droit@test.local', nom: 'Sans droit', password: 'motdepasse-test', roles: [role.id] },
    })
    const avecRoles = await payload.findByID({ collection: 'users', id: benevole.id, depth: 1 })
    const reponse = await appeler(avecRoles, { id: photo.id, nom: 'autre-nom' })
    expect(reponse.status).toBe(403)
  })
})
