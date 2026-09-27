import fs from 'node:fs'
import path from 'node:path'

import type { Payload } from 'payload'

import type { Action, Section } from '../access'
import type { Activite, Galerie } from '../payload-types'
import activites from './activites.json'
import galerie from './galerie.json'

// Import idempotent du contenu du site statique (site3/) : rejouable sans créer de doublons.

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Voir planning'] as const
type Jour = (typeof JOURS)[number]
const TOUT: Action[] = ['voir', 'creer', 'modifier', 'publier', 'supprimer']
const PHOTOS: Action[] = ['voir', 'creer', 'modifier']

type RoleDepart = {
  nom: string
  description: string
  permissions: { section: Section; actions: Action[] }[]
  activites?: string[]
}

export const ROLES_DEPART: RoleDepart[] = [
  {
    nom: 'Bureau',
    description: 'Tout le contenu du site, sauf l’apparence et l’administration.',
    permissions: (
      ['vie-du-club', 'membres-bureau', 'activites', 'sorties', 'galerie', 'documents', 'media', 'flash-info', 'tarifs'] as Section[]
    ).map((section) => ({ section, actions: TOUT })),
  },
  {
    nom: 'Équipe Sorties & Voyages',
    description: 'Sorties et voyages, avec leurs photos.',
    permissions: [
      { section: 'sorties', actions: TOUT },
      { section: 'galerie', actions: PHOTOS },
      { section: 'media', actions: PHOTOS },
    ],
  },
  {
    nom: 'Équipe Galerie',
    description: 'Galerie photo du site.',
    permissions: [
      { section: 'galerie', actions: TOUT },
      { section: 'media', actions: PHOTOS },
    ],
  },
  {
    nom: 'Responsable Jeux de cartes',
    description: 'Exemple de rôle limité à une seule activité : la page « Jeux de cartes ».',
    permissions: [
      { section: 'activites', actions: ['voir', 'modifier', 'publier'] },
      { section: 'media', actions: PHOTOS },
    ],
    activites: ['13'],
  },
]

const normaliserCreneau = (creneau: { jour: string; horaire: string; lieu: string }) => {
  const jour = JOURS.find((j) => creneau.jour.startsWith(j)) ?? 'Voir planning'
  const reste = creneau.jour.slice(jour.length).trim()
  return { jour: jour as Jour, horaire: reste ? `${reste} — ${creneau.horaire}` : creneau.horaire, lieu: creneau.lieu }
}

// Fichier du site importé une seule fois dans la médiathèque (retrouvé par son nom).
export const importerMedia = async (payload: Payload, fichier: string, alt: string) => {
  const filename = path.basename(fichier)
  const existant = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existant.docs[0]) return existant.docs[0].id
  if (!fs.existsSync(fichier)) return undefined
  try {
    const media = await payload.create({ collection: 'media', data: { alt }, filePath: fichier, overrideAccess: true })
    return media.id
  } catch {
    // Fichier corrompu (ex. page HTML enregistrée en .jpg) : ignoré et compté par l’appelant.
    payload.logger.warn(`Fichier ignoré, image illisible : ${filename}`)
    return undefined
  }
}

export const importerRoles = async (payload: Payload) => {
  const ids: Record<string, number> = {}
  for (const role of ROLES_DEPART) {
    const existant = await payload.find({ collection: 'roles', where: { nom: { equals: role.nom } }, limit: 1, depth: 0 })
    if (existant.docs[0]) {
      ids[role.nom] = existant.docs[0].id
      continue
    }
    const activitesAutorisees = role.activites?.length
      ? (
          await payload.find({ collection: 'activites', where: { slug: { in: role.activites } }, depth: 0, draft: true })
        ).docs.map((a) => a.id)
      : []
    const cree = await payload.create({
      collection: 'roles',
      data: { nom: role.nom, description: role.description, permissions: role.permissions, activitesAutorisees },
    })
    ids[role.nom] = cree.id
  }
  return ids
}

export const importerActivites = async (payload: Payload, siteDir: string) => {
  let crees = 0
  let misesAJour = 0
  for (const activite of activites) {
    const icone = await importerMedia(payload, path.join(siteDir, activite.logo), `Logo ${activite.nom}`)
    const animateurs = []
    for (const animateur of activite.animateurs as { nom: string; photo?: string }[]) {
      const photo = animateur.photo
        ? await importerMedia(payload, path.join(siteDir, animateur.photo), `Portrait de ${animateur.nom}`)
        : undefined
      animateurs.push({ nom: animateur.nom, photo })
    }
    const data = {
      nom: activite.nom,
      slug: activite.slug,
      ordre: activite.ordre,
      description: activite.description,
      presentation: activite.presentation || undefined,
      niveau: activite.niveau || undefined,
      icone,
      creneaux: activite.creneaux.map(normaliserCreneau),
      pointRencontre: activite.pointRencontre || undefined,
      carte: activite.carte ?? undefined,
      animateurs,
      infos: activite.infos,
      _status: 'published' as const,
    } satisfies Partial<Activite>
    const existant = await payload.find({
      collection: 'activites',
      where: { slug: { equals: activite.slug } },
      limit: 1,
      depth: 0,
    })
    if (existant.docs[0]) {
      // Mise à jour : ne remplace que ce qui vient du site, sans toucher aux photos ajoutées dans le CMS.
      await payload.update({ collection: 'activites', id: existant.docs[0].id, data })
      misesAJour++
    } else {
      await payload.create({ collection: 'activites', data })
      crees++
    }
  }
  return { crees, misesAJour }
}

export const importerGalerie = async (payload: Payload, siteDir: string) => {
  let crees = 0
  let ignores = 0
  for (const photo of galerie) {
    const deja = await payload.count({ collection: 'galerie', where: { fichierOrigine: { equals: photo.fichier } } })
    if (deja.totalDocs) continue
    const chemin = photo.fichier.includes('/') ? photo.fichier : path.join('photos', photo.fichier)
    const media = await importerMedia(payload, path.join(siteDir, chemin), `Photo CBRS ${photo.annee}`)
    if (!media) {
      ignores++
      continue
    }
    await payload.create({
      collection: 'galerie',
      data: {
        photo: media,
        annee: photo.annee,
        categorie: photo.categorie as Galerie['categorie'],
        activite: photo.activite as Galerie['activite'],
        legende: 'legende' in photo ? (photo.legende as string) : undefined,
        fichierOrigine: photo.fichier,
        afficherSurSite: true,
      },
    })
    crees++
  }
  return { crees, ignores }
}
