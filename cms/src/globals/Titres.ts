import type { Field, GlobalConfig, Tab } from 'payload'

import { cacheSansDroit, peut } from '../access'

type Texte = { surtitre?: string; titre: string; mot?: string; intro?: string }

// Un titre de section : sur-titre, titre, mot mis en valeur (italique bleu) et introduction.
// Un champ laissé vide garde le texte livré avec le site. Sur-titre et introduction ne sont
// proposés que si la section en a un sur le site (sinon le champ serait sans effet).
const titre = (name: string, label: string, d: Texte): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'surtitre', label: 'Sur-titre', type: 'text', defaultValue: d.surtitre ?? '', admin: { description: 'Petit texte vert au-dessus du titre.', hidden: d.surtitre === undefined } },
    { name: 'titre', label: 'Titre', type: 'text', defaultValue: d.titre },
    {
      name: 'motMisEnValeur',
      label: 'Mot mis en valeur',
      type: 'text',
      defaultValue: d.mot ?? '',
      admin: { description: 'Mot ou groupe de mots du titre affiché en italique bleu ; doit figurer tel quel dans le titre.' },
    },
    { name: 'introduction', label: 'Introduction', type: 'textarea', defaultValue: d.intro ?? '', admin: { description: 'Phrase sous le titre.', hidden: d.intro === undefined } },
  ],
})

const onglet = (label: string, titres: Field[]): Tab => ({ label, fields: titres })

export const Titres: GlobalConfig = {
  slug: 'titres',
  label: 'Titres des pages',
  admin: {
    group: 'Administration',
    hidden: cacheSansDroit('apparence'),
    description:
      'Titres des sections de chaque page du site. Un champ laissé vide garde le texte d’origine du site. Le mot mis en valeur s’affiche en italique bleu.',
  },
  access: {
    read: () => true,
    readVersions: peut('apparence', 'voir'),
    update: peut('apparence', 'modifier'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        onglet('Accueil', [
          titre('vieDuClub', 'Vie du club', { titre: 'Vie du club', mot: 'club' }),
          titre('quiSommesNous', 'Qui sommes-nous ?', { titre: 'Qui sommes-nous ?', mot: 'nous' }),
        ]),
        onglet('Activités', [
          titre('activites', 'Choix de l’activité', {
            surtitre: 'Choisissez votre activité',
            titre: 'Quelle activité vous donne envie de bouger ?',
            mot: 'bouger',
            intro: 'Sélectionnez une icône pour découvrir sa fiche, ses horaires et les informations pratiques.',
          }),
        ]),
        onglet('Adhésion', [
          titre('adhesion', 'Formulaire d’adhésion', {
            titre: "Formulaire d'Adhésion",
            mot: 'Adhésion',
            intro: 'Rejoignez le CBRS ! Remplissez ce formulaire et nous vous contacterons pour finaliser votre inscription.',
          }),
        ]),
        onglet('Contact', [
          titre('nousContacter', 'Nous contacter', { titre: 'Nous contacter', mot: 'contacter' }),
          titre('nousTrouver', 'Nous trouver', { titre: 'Nous trouver', mot: 'trouver' }),
        ]),
        onglet('Formation', [
          titre('fichesFormation', 'Fiches formation par activité', { titre: 'Fiches formation par activité', mot: 'activité' }),
        ]),
        onglet('Galerie', [
          titre('galerie', 'Galerie', {
            surtitre: 'Explorer la galerie',
            titre: 'Nos plus beaux souvenirs',
            mot: 'souvenirs',
            intro: 'Revivez les moments qui nous rassemblent : sorties, activités, sourires et souvenirs partagés.',
          }),
        ]),
        onglet('Liens utiles', [
          titre('ressources', 'Ressources du club', {
            surtitre: 'Partenaires',
            titre: 'Les ressources du club',
            mot: 'club',
            intro: 'Les partenaires et ressources qui accompagnent la vie du club.',
          }),
          titre('documents', 'Documents à télécharger', { titre: 'Documents à télécharger', mot: 'télécharger' }),
        ]),
        onglet('Planning', [
          titre('planning', 'Planning', {
            surtitre: 'Semaine type',
            titre: 'Planning hebdomadaire',
            mot: 'hebdomadaire',
            intro: 'Toutes les activités, jours, horaires et lieux.',
          }),
        ]),
        onglet('Sorties & Voyages', [
          titre('manifestations', 'Nos manifestations', {
            surtitre: 'Vie du club',
            titre: 'Nos manifestations',
            mot: 'manifestations',
            intro: 'Les grands rendez-vous et journées festives de la vie du club.',
          }),
          titre('sorties', 'Nos sorties', {
            surtitre: 'À la journée',
            titre: 'Nos sorties',
            mot: 'sorties',
            intro: 'Le club organise régulièrement des sorties à la journée pour ses adhérents.',
          }),
          titre('voyages', 'Nos voyages', {
            surtitre: 'Plusieurs jours',
            titre: 'Nos voyages',
            mot: 'voyages',
            intro: 'Le programme des prochains voyages sera publié ici. Pour toute information, contactez l’équipe organisatrice.',
          }),
        ]),
        onglet('Statuts', [
          titre('statuts', 'Statuts et règlement intérieur', {
            surtitre: 'Vie associative',
            titre: 'Statuts et règlement intérieur',
            mot: 'règlement intérieur',
            intro:
              'Le Club du Beauvaisis de la Retraite Sportive est une association loi 1901. Ses statuts et son règlement intérieur définissent son objet, son organisation et les règles de vie communes à tous les adhérents.',
          }),
        ]),
      ],
    },
  ],
}
