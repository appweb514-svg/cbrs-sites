import 'dotenv/config'

import path from 'node:path'

import { getPayload } from 'payload'

import config from '../payload.config'
import { importerActivites, importerGalerie, importerRoles } from './import'

const password = process.env.CBRS_SEED_PASSWORD
const siteDir = path.resolve(process.cwd(), process.env.CBRS_SITE_DIR ?? '../site3')

const payload = await getPayload({ config: await config })

// Contenu du site statique : rejouable à tout moment (mise à jour par identifiant, sans doublons).
const activitesImport = await importerActivites(payload, siteDir)
const roles = await importerRoles(payload)
const galerieImport = await importerGalerie(payload, siteDir)
payload.logger.info(
  `Import du site : activités ${activitesImport.crees} créées / ${activitesImport.misesAJour} mises à jour, ` +
    `galerie ${galerieImport.crees} photos ajoutées (${galerieImport.ignores} fichiers absents ou illisibles), ${Object.keys(roles).length} rôles.`,
)

// Jeu de démonstration : seulement sur une base sans compte.
if ((await payload.count({ collection: 'users' })).totalDocs > 0) {
  payload.logger.info('La base contient déjà des comptes : jeu de démonstration ignoré.')
  process.exit(0)
}
if (!password || password.length < 12) {
  throw new Error('Définissez CBRS_SEED_PASSWORD (12 caractères minimum) pour créer les comptes de démonstration.')
}

const comptes = [
  { email: 'admin@cbrs.local', nom: 'Administrateur', estAdministrateur: true, roles: [] },
  { email: 'bureau@cbrs.local', nom: 'Membre du bureau', roles: [roles['Bureau']] },
  { email: 'cartes@cbrs.local', nom: 'Responsable Jeux de cartes', roles: [roles['Responsable Jeux de cartes']] },
  { email: 'sorties@cbrs.local', nom: 'Équipe Sorties & Voyages', roles: [roles['Équipe Sorties & Voyages']] },
]

for (const compte of comptes) {
  await payload.create({ collection: 'users', data: { ...compte, password } })
}

const actualites = [
  { titre: 'Repas des bénévoles au Touquet', date: '2026-06-11', categorie: 'club', resume: 'Un moment de reconnaissance pour tous les bénévoles qui font vivre le club tout au long de l’année.' },
  { titre: 'Journée au Plan d’eau du Canada', date: '2026-05-27', categorie: 'sortie', resume: 'Une belle journée conviviale rassemblant les adhérents autour d’activités variées sous le soleil.' },
  { titre: 'Journée Olympiades Seniors', date: '2024-04-15', categorie: 'evenement', resume: 'Une journée sportive et ludique pour les seniors du Beauvaisis.' },
] as const

for (const actu of actualites) {
  await payload.create({ collection: 'vie-du-club', data: { ...actu, _status: 'published' } })
}

for (const [ordre, fonction] of ['Président(e)', 'Vice-président(e)', 'Secrétaire', 'Trésorier(ère)'].entries()) {
  await payload.create({ collection: 'membres-bureau', data: { nom: 'Nom à compléter', fonction, ordre: (ordre + 1) * 10 } })
}

await payload.updateGlobal({
  slug: 'flash-info',
  data: { actif: true, message: 'Inscriptions saison 2025-2026 ouvertes — contactez le club ou consultez la page adhésion.' },
})

await payload.updateGlobal({
  slug: 'tarifs',
  data: {
    lignes: [
      { montant: '49 €', libelle: 'Libellé à préciser' },
      { montant: '28 €', libelle: 'Libellé à préciser' },
      { montant: '20 €', libelle: 'Libellé à préciser' },
    ],
  },
})

await payload.updateGlobal({
  slug: 'parametres',
  data: {
    depuis: '1993',
    adherents: '1 200',
    activites: '≈ 20',
    emailContact: 'cbrs@cbrs60.fr',
    emailSorties: 'martinelcbrs60@gmail.com',
  },
})

await payload.create({
  collection: 'sorties',
  draft: true,
  data: {
    type: 'voyage',
    titre: 'Voyage d’exemple',
    date: '2027-05-10',
    lieu: 'Destination à définir',
    resume: 'Voyage de démonstration laissé en brouillon : visible uniquement par les équipes autorisées.',
    description: 'Complétez la destination, le programme et le tarif lorsque le projet sera arrêté.',
    _status: 'draft',
  },
})

payload.logger.info(
  `Jeu de démonstration créé : ${comptes.length} comptes, ${actualites.length} actualités, 1 voyage en brouillon.`,
)
process.exit(0)
