import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'
import activites from './activites.json'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Voir planning'] as const
type Jour = (typeof JOURS)[number]

const password = process.env.CBRS_SEED_PASSWORD
if (!password || password.length < 12) {
  throw new Error('Définissez CBRS_SEED_PASSWORD (12 caractères minimum) avant de lancer le jeu de démonstration.')
}

const normaliserCreneau = (creneau: { jour: string; horaire: string; lieu: string }) => {
  const jour = JOURS.find((j) => creneau.jour.startsWith(j)) ?? 'Voir planning'
  const reste = creneau.jour.slice(jour.length).trim()
  return { jour: jour as Jour, horaire: reste ? `${reste} — ${creneau.horaire}` : creneau.horaire, lieu: creneau.lieu }
}

const payload = await getPayload({ config: await config })

const existing = await payload.count({ collection: 'users' })
if (existing.totalDocs > 0) {
  payload.logger.info('La base contient déjà des comptes : jeu de démonstration ignoré.')
  process.exit(0)
}

const comptes = [
  { email: 'admin@cbrs.local', nom: 'Administrateur', roles: ['admin'] as const },
  { email: 'bureau@cbrs.local', nom: 'Membre du bureau', roles: ['bureau'] as const },
  { email: 'randonnee@cbrs.local', nom: 'Référent Randonnée', roles: ['activites'] as const },
  { email: 'sorties@cbrs.local', nom: 'Équipe Sorties & Voyages', roles: ['sorties'] as const },
]

const users: Record<string, number> = {}
for (const compte of comptes) {
  const user = await payload.create({ collection: 'users', data: { ...compte, roles: [...compte.roles], password } })
  users[compte.email] = user.id
}

for (const activite of activites) {
  await payload.create({
    collection: 'activites',
    data: {
      ...activite,
      creneaux: activite.creneaux.map(normaliserCreneau),
      referents: activite.nom === 'Randonnée' ? [users['randonnee@cbrs.local']] : [],
      _status: 'published',
    },
  })
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
  `Jeu de démonstration créé : ${comptes.length} comptes, ${activites.length} activités, ${actualites.length} actualités, 1 voyage en brouillon.`,
)
process.exit(0)
