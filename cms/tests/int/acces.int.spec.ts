import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { Activite, User } from '@/payload-types'

let payload: Payload
let admin: User
let bureau: User
let referentRando: User
let sorties: User
let randonnee: Activite
let danse: Activite

const createUser = (email: string, nom: string, roles: User['roles']) =>
  payload.create({
    collection: 'users',
    data: { email, nom, roles, password: 'motdepasse-test' },
  })

const withUser = (user: User) => ({ user: { ...user, collection: 'users' as const }, overrideAccess: false })

describe('Droits d’accès du CMS', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    admin = await createUser('admin@test.local', 'Admin', ['admin'])
    bureau = await createUser('bureau@test.local', 'Bureau', ['bureau'])
    referentRando = await createUser('rando@test.local', 'Référent rando', ['activites'])
    sorties = await createUser('sorties@test.local', 'Équipe sorties', ['sorties'])

    randonnee = await payload.create({
      collection: 'activites',
      data: { nom: 'Randonnée', description: 'Marche', referents: [referentRando.id], _status: 'published' },
    })
    danse = await payload.create({
      collection: 'activites',
      data: { nom: 'Danse', description: 'Danse de salon', referents: [], _status: 'published' },
    })
  })

  describe('Responsable d’activité', () => {
    it('modifie une activité dont il est référent', async () => {
      const updated = await payload.update({
        collection: 'activites',
        id: randonnee.id,
        data: { description: 'Randonnée du Beauvaisis' },
        ...withUser(referentRando),
      })
      expect(updated.description).toBe('Randonnée du Beauvaisis')
    })

    it('ne peut pas modifier une autre activité', async () => {
      await expect(
        payload.update({ collection: 'activites', id: danse.id, data: { description: 'piraté' }, ...withUser(referentRando) }),
      ).rejects.toThrow()
      const unchanged = await payload.findByID({ collection: 'activites', id: danse.id })
      expect(unchanged.description).toBe('Danse de salon')
    })

    it('ne voit que ses activités dans l’administration', async () => {
      const { docs } = await payload.find({ collection: 'activites', ...withUser(referentRando) })
      expect(docs.map((doc) => doc.nom)).toEqual(['Randonnée'])
    })

    it('ne peut pas s’ajouter comme référent d’une autre activité', async () => {
      await payload.update({
        collection: 'activites',
        id: randonnee.id,
        data: { referents: [referentRando.id, sorties.id] },
        ...withUser(referentRando),
      })
      const doc = await payload.findByID({ collection: 'activites', id: randonnee.id, depth: 0 })
      expect(doc.referents).toEqual([referentRando.id])
    })

    it('ne peut pas publier une actualité « Vie du club »', async () => {
      await expect(
        payload.create({
          collection: 'vie-du-club',
          data: { titre: 'Test', date: new Date().toISOString(), categorie: 'club', resume: 'Test' },
          ...withUser(referentRando),
        }),
      ).rejects.toThrow()
    })

    it('ne peut pas s’attribuer le rôle administrateur', async () => {
      await payload.update({ collection: 'users', id: referentRando.id, data: { roles: ['admin'] }, ...withUser(referentRando) })
      const self = await payload.findByID({ collection: 'users', id: referentRando.id })
      expect(self.roles).toEqual(['activites'])
    })
  })

  describe('Bureau', () => {
    it('publie une actualité et modifie toutes les activités', async () => {
      const actu = await payload.create({
        collection: 'vie-du-club',
        data: { titre: 'Assemblée générale', date: new Date().toISOString(), categorie: 'club', resume: 'Rendez-vous', _status: 'published' },
        ...withUser(bureau),
      })
      expect(actu.titre).toBe('Assemblée générale')
      const updated = await payload.update({ collection: 'activites', id: danse.id, data: { description: 'Danse en ligne' }, ...withUser(bureau) })
      expect(updated.description).toBe('Danse en ligne')
    })

    it('ne gère pas les comptes bénévoles', async () => {
      await expect(createUserAs(bureau)).rejects.toThrow()
    })
  })

  describe('Équipe sorties', () => {
    it('n’a aucun droit sur les activités ni sur la Vie du club', async () => {
      await expect(
        payload.update({ collection: 'activites', id: randonnee.id, data: { description: 'x' }, ...withUser(sorties) }),
      ).rejects.toThrow()
      await expect(
        payload.create({
          collection: 'vie-du-club',
          data: { titre: 'x', date: new Date().toISOString(), categorie: 'club', resume: 'x' },
          ...withUser(sorties),
        }),
      ).rejects.toThrow()
    })
  })

  describe('Site public (visiteur anonyme)', () => {
    it('lit les contenus publiés mais pas les brouillons', async () => {
      await payload.create({
        collection: 'vie-du-club',
        data: { titre: 'Brouillon secret', date: new Date().toISOString(), categorie: 'club', resume: 'x', _status: 'draft' },
        draft: true,
      })
      const { docs } = await payload.find({ collection: 'vie-du-club', overrideAccess: false })
      const titres = docs.map((doc) => doc.titre)
      expect(titres).toContain('Assemblée générale')
      expect(titres).not.toContain('Brouillon secret')
    })

    it('ne peut pas lister les bénévoles', async () => {
      await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
    })
  })

  describe('Administrateur', () => {
    it('crée des comptes bénévoles', async () => {
      const created = await createUserAs(admin)
      expect(created.roles).toEqual(['galerie'])
    })
  })
})

function createUserAs(user: User) {
  return payload.create({
    collection: 'users',
    data: { email: `nouveau-${Date.now()}@test.local`, nom: 'Nouveau', roles: ['galerie'], password: 'motdepasse-test' },
    ...withUser(user),
  })
}
