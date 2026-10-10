import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'

import { contrasteAvecBlanc } from '@/couleurs'
import config from '@/payload.config'
import type { Activite, User } from '@/payload-types'
import { importerRoles } from '@/seed/import'

let payload: Payload
let admin: User
let bureau: User
let cartes: User
let sorties: User
let galerie: User
let jeuxCartes: Activite
let danse: Activite
let fichierTest: string

const createUser = async (email: string, nom: string, roles: number[], estAdministrateur = false) => {
  const user = await payload.create({
    collection: 'users',
    data: { email, nom, roles, estAdministrateur, password: 'motdepasse-test' },
  })
  // Comme à la connexion (auth.depth = 1) : rôles peuplés.
  return payload.findByID({ collection: 'users', id: user.id, depth: 1 })
}

const withUser = (user: User) => ({ user: { ...user, collection: 'users' as const }, overrideAccess: false })

const sortie = (titre: string, _status: 'draft' | 'published' = 'published') => ({
  type: 'sortie' as const,
  titre,
  date: new Date().toISOString(),
  lieu: 'Beauvais',
  resume: 'Journée conviviale.',
  _status,
})

describe('Droits d’accès du CMS', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    admin = await createUser('admin@test.local', 'Admin', [], true)

    jeuxCartes = await payload.create({
      collection: 'activites',
      data: { nom: 'Jeux de cartes', slug: '13', description: 'Belote et tarot', _status: 'published' },
    })
    danse = await payload.create({
      collection: 'activites',
      data: { nom: 'Danse', slug: '14', description: 'Danse de salon', _status: 'published' },
    })

    const roles = await importerRoles(payload)
    bureau = await createUser('bureau@test.local', 'Bureau', [roles['Bureau']])
    cartes = await createUser('cartes@test.local', 'Responsable cartes', [roles['Responsable Jeux de cartes']])
    sorties = await createUser('sorties@test.local', 'Équipe sorties', [roles['Équipe Sorties & Voyages']])
    galerie = await createUser('galerie@test.local', 'Équipe galerie', [roles['Équipe Galerie']])

    fichierTest = join(mkdtempSync(join(tmpdir(), 'cbrs-cms-test-')), 'photo-test.png')
    writeFileSync(
      fichierTest,
      await sharp({ create: { width: 32, height: 32, channels: 3, background: 'rgb(200, 60, 30)' } })
        .png()
        .toBuffer(),
    )

    await payload.create({
      collection: 'vie-du-club',
      data: {
        titre: 'Assemblée générale',
        date: new Date().toISOString(),
        categorie: 'club',
        resume: 'x',
        lien: { type: 'page', page: '/statuts' },
        _status: 'published',
      },
    })
    await payload.updateGlobal({ slug: 'tarifs', data: { lignes: [{ montant: '49 €', libelle: 'Adhésion' }] } })
  })

  describe('Rôle limité à une activité (Jeux de cartes)', () => {
    it('modifie et publie sa propre activité', async () => {
      const updated = await payload.update({
        collection: 'activites',
        id: jeuxCartes.id,
        data: { description: 'Belote, tarot et rami', _status: 'published' },
        ...withUser(cartes),
      })
      expect(updated.description).toBe('Belote, tarot et rami')
    })

    it('ne peut pas modifier une autre activité', async () => {
      await expect(
        payload.update({ collection: 'activites', id: danse.id, data: { description: 'x' }, ...withUser(cartes) }),
      ).rejects.toThrow()
    })

    it('modifie les horaires de son activité (affichés sur le Planning), pas ceux des autres', async () => {
      const creneaux = [{ jour: 'Mardi', horaire: '14h00 - 17h00', lieu: 'Salle des fêtes' }]
      const updated = await payload.update({
        collection: 'activites',
        id: jeuxCartes.id,
        data: { creneaux, _status: 'published' },
        ...withUser(cartes),
      })
      expect(updated.creneaux?.[0]).toMatchObject(creneaux[0])
      await expect(
        payload.update({ collection: 'activites', id: danse.id, data: { creneaux }, ...withUser(cartes) }),
      ).rejects.toThrow()
    })

    it('ne voit que son activité dans l’administration', async () => {
      const { docs } = await payload.find({ collection: 'activites', draft: true, ...withUser(cartes) })
      expect(docs.map((doc) => doc.slug)).toEqual(['13'])
    })

    it('ne peut ni créer ni supprimer d’activité', async () => {
      await expect(
        payload.create({
          collection: 'activites',
          data: { nom: 'Poker', slug: '99', description: 'x' },
          draft: true,
          ...withUser(cartes),
        }),
      ).rejects.toThrow()
      await expect(payload.delete({ collection: 'activites', id: jeuxCartes.id, ...withUser(cartes) })).rejects.toThrow()
    })

    it('ne peut pas s’attribuer un rôle ni devenir administrateur', async () => {
      const updated = await payload.update({
        collection: 'users',
        id: cartes.id,
        data: { estAdministrateur: true, roles: [] },
        ...withUser(cartes),
      })
      expect(updated.estAdministrateur).toBe(false)
      expect(updated.roles).toHaveLength(1)
    })

    it('ne peut pas créer de rôle', async () => {
      await expect(
        payload.create({ collection: 'roles', data: { nom: 'Pirate', permissions: [] }, ...withUser(cartes) }),
      ).rejects.toThrow()
    })
  })

  describe('Bureau', () => {
    it('publie une actualité et modifie toutes les activités', async () => {
      const actu = await payload.create({
        collection: 'vie-du-club',
        data: { titre: 'Repas', date: new Date().toISOString(), categorie: 'club', resume: 'x', _status: 'published' },
        ...withUser(bureau),
      })
      expect(actu._status).toBe('published')
      const updated = await payload.update({
        collection: 'activites',
        id: danse.id,
        data: { niveau: 'Tous niveaux' },
        ...withUser(bureau),
      })
      expect(updated.niveau).toBe('Tous niveaux')
    })

    it('ne gère ni les comptes, ni les paramètres, ni l’apparence', async () => {
      await expect(payload.find({ collection: 'users', ...withUser(bureau) })).resolves.toMatchObject({ totalDocs: 1 })
      await expect(
        payload.updateGlobal({ slug: 'parametres', data: { depuis: '1990' }, ...withUser(bureau) }),
      ).rejects.toThrow()
      await expect(
        payload.updateGlobal({ slug: 'apparence', data: { couleurPrincipale: '#123456' }, ...withUser(bureau) }),
      ).rejects.toThrow()
    })
  })

  describe('Équipe sorties', () => {
    it('crée, modifie et publie une sortie', async () => {
      const cree = await payload.create({ collection: 'sorties', data: sortie('Sortie au Plan d’eau'), ...withUser(sorties) })
      const updated = await payload.update({
        collection: 'sorties',
        id: cree.id,
        data: { lieu: 'Plan d’eau du Canada' },
        ...withUser(sorties),
      })
      expect(updated.lieu).toBe('Plan d’eau du Canada')
    })

    it('ajoute des photos à la galerie mais ne peut pas en supprimer', async () => {
      const photo = await payload.create({
        collection: 'media',
        data: { alt: 'Photo de test' },
        filePath: fichierTest,
        ...withUser(sorties),
      })
      const entree = await payload.create({
        collection: 'galerie',
        data: { annee: 2026, photo: photo.id, categorie: 'sortie' },
        ...withUser(sorties),
      })
      await expect(payload.delete({ collection: 'galerie', id: entree.id, ...withUser(sorties) })).rejects.toThrow()
    })

    it('n’a aucun droit sur les activités ni sur la Vie du club', async () => {
      await expect(
        payload.update({ collection: 'activites', id: danse.id, data: { description: 'x' }, ...withUser(sorties) }),
      ).rejects.toThrow()
      await expect(
        payload.create({
          collection: 'vie-du-club',
          data: { titre: 'x', date: new Date().toISOString(), categorie: 'club', resume: 'x' },
          draft: true,
          ...withUser(sorties),
        }),
      ).rejects.toThrow()
    })
  })

  describe('Droit « Publier »', () => {
    it('sans ce droit, un bénévole enregistre un brouillon mais ne publie pas', async () => {
      const role = await payload.create({
        collection: 'roles',
        data: { nom: 'Rédaction sorties', permissions: [{ section: 'sorties', actions: ['voir', 'creer', 'modifier'] }] },
      })
      const redacteur = await createUser('redaction@test.local', 'Rédaction', [role.id])
      const brouillon = await payload.create({
        collection: 'sorties',
        data: sortie('Sortie en préparation', 'draft'),
        draft: true,
        ...withUser(redacteur),
      })
      expect(brouillon._status).toBe('draft')
      await expect(
        payload.update({ collection: 'sorties', id: brouillon.id, data: { _status: 'published' }, ...withUser(redacteur) }),
      ).rejects.toThrow(/publier/i)
    })
  })

  describe('Équipe galerie', () => {
    it('gère la galerie mais pas les sorties', async () => {
      const photo = await payload.create({
        collection: 'media',
        data: { alt: 'Photo de test' },
        filePath: fichierTest,
        ...withUser(galerie),
      })
      const entree = await payload.create({
        collection: 'galerie',
        data: { album: 'Sorties 2026', annee: 2026, photo: photo.id, legende: 'Ambiance', categorie: 'sortie' },
        ...withUser(galerie),
      })
      expect(entree.album).toBe('Sorties 2026')
      await expect(
        payload.create({ collection: 'sorties', data: sortie('Voyage interdit'), ...withUser(galerie) }),
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
      expect(docs.find((doc) => doc.titre === 'Assemblée générale')?.lien).toMatchObject({ type: 'page', page: '/statuts' })
    })

    it('ne voit plus une activité dépubliée', async () => {
      await payload.update({ collection: 'activites', id: danse.id, data: { _status: 'draft' }, draft: false })
      const { docs } = await payload.find({ collection: 'activites', overrideAccess: false })
      expect(docs.map((doc) => doc.slug)).not.toContain('14')
    })

    it('ne voit que les photos et documents marqués « afficher »', async () => {
      const photo = await payload.create({ collection: 'media', data: { alt: 'x' }, filePath: fichierTest })
      await payload.create({
        collection: 'galerie',
        data: { annee: 2025, photo: photo.id, legende: 'Photo masquée', categorie: 'vie', afficherSurSite: false },
      })
      const { docs } = await payload.find({ collection: 'galerie', overrideAccess: false })
      expect(docs.map((doc) => doc.legende)).not.toContain('Photo masquée')
    })

    it('ne peut pas lister les bénévoles ni les rôles', async () => {
      await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
      await expect(payload.find({ collection: 'roles', overrideAccess: false })).rejects.toThrow()
    })

    it('lit les tarifs et l’apparence', async () => {
      const tarifs = await payload.findGlobal({ slug: 'tarifs', overrideAccess: false })
      expect(tarifs.lignes?.map((ligne) => ligne.montant)).toEqual(['49 €'])
      const apparence = await payload.findGlobal({ slug: 'apparence', overrideAccess: false })
      expect(apparence.couleurPrincipale).toBe('#0a3273')
    })
  })

  describe('Apparence', () => {
    it('refuse une couleur illisible avec le texte blanc', async () => {
      expect(contrasteAvecBlanc('#0a3273')).toBeGreaterThan(4.5)
      await expect(
        payload.updateGlobal({ slug: 'apparence', data: { couleurPrincipale: '#ffee00' }, ...withUser(admin) }),
      ).rejects.toThrow()
    })

    it('revient à l’apparence d’origine', async () => {
      await payload.updateGlobal({
        slug: 'apparence',
        data: { couleurPrincipale: '#5b1a8a', policeTitres: 'Poppins', enTetes: [{ page: '/galerie', titre: 'Nos photos' }] },
        ...withUser(admin),
      })
      const origine = await payload.updateGlobal({ slug: 'apparence', data: { valeursOrigine: true }, ...withUser(admin) })
      expect(origine.couleurPrincipale).toBe('#0a3273')
      expect(origine.policeTitres).toBe('defaut')
      expect(origine.enTetes).toEqual([])
    })
  })

  describe('Administrateur', () => {
    it('crée des rôles et des comptes', async () => {
      const role = await payload.create({
        collection: 'roles',
        data: { nom: 'Responsable Danse', permissions: [{ section: 'activites', actions: ['voir', 'modifier'] }], activitesAutorisees: [danse.id] },
        ...withUser(admin),
      })
      const compte = await payload.create({
        collection: 'users',
        data: { email: 'danse@test.local', nom: 'Danse', roles: [role.id], password: 'motdepasse-test' },
        ...withUser(admin),
      })
      expect(compte.roles).toHaveLength(1)
    })

    it('ne peut pas retirer ou supprimer le dernier administrateur', async () => {
      await expect(
        payload.update({ collection: 'users', id: admin.id, data: { estAdministrateur: false }, ...withUser(admin) }),
      ).rejects.toThrow(/dernier administrateur/)
      await expect(payload.delete({ collection: 'users', id: admin.id, ...withUser(admin) })).rejects.toThrow(
        /dernier administrateur/,
      )
    })
  })
})
