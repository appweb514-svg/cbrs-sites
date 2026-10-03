import type { Field, GlobalConfig, Tab } from 'payload'

import { cacheSansDroit, peut } from '../access'

// Pictogrammes d’activité livrés avec le site (dossier site3/).
export const ICONES = [
  { label: 'Aquagym', value: '01_aquagym.png' },
  { label: 'Pétanque', value: '02_petanque.png' },
  { label: 'Cyclisme', value: '03_cyclisme.png' },
  { label: 'Tir à l’arc', value: '04_tir_a_l_arc.png' },
  { label: 'Ping-pong', value: '05_ping_pong.png' },
  { label: 'Tennis de table', value: '05_tennis_de_table.png' },
  { label: 'Tennis', value: '06_tennis.png' },
  { label: 'Randonnée', value: '07_randonnee.png' },
  { label: 'Marche nordique', value: '08_marche_nordique.png' },
  { label: 'Gymnastique', value: '09_gymnastique.png' },
  { label: 'Pickleball', value: '10_pickleball.png' },
  { label: 'Tai-chi', value: '11_tai_chi.png' },
  { label: 'Échecs', value: '12_echecs.png' },
  { label: 'Jeux de cartes', value: '13_jeux_de_cartes.png' },
  { label: 'Danse', value: '14_danse.png' },
  { label: 'Atelier mémoire', value: '15_atelier_memoire.png' },
  { label: 'Bridge', value: '16_bridge.png' },
] as const

export const MAX_ETAPES = 8
export const MAX_CARTES = 24

// PDF choisi dans la médiathèque Documents ; à défaut, le fichier livré avec le site (`ficheSite`).
const ficheFields: Field[] = [
  {
    name: 'fiche',
    label: 'Fiche PDF',
    type: 'upload',
    relationTo: 'documents',
    admin: { description: 'PDF de la médiathèque Documents. Laissez vide pour garder le fichier livré avec le site.' },
  },
  { name: 'ficheSite', type: 'text', admin: { hidden: true } },
]

const pdf = (fichier: string) => `docs/FFRS_Formation_${fichier}_Aout-2025.pdf`

const parcours: Tab = {
  label: 'Parcours',
  fields: [
    { name: 'parcoursSurtitre', label: 'Sur-titre', type: 'text', defaultValue: 'Parcours de formation' },
    { name: 'parcoursTitre', label: 'Titre', type: 'text', defaultValue: 'Devenir animateur vous tente ?' },
    {
      name: 'parcoursTexte',
      label: 'Texte',
      type: 'textarea',
      defaultValue:
        'Voici le cheminement pour encadrer bénévolement une activité au sein du CBRS, étape après étape.',
    },
    {
      name: 'etapes',
      label: 'Étapes du parcours',
      labels: { singular: 'Étape', plural: 'Étapes' },
      type: 'array',
      maxRows: MAX_ETAPES,
      admin: {
        description: `Jusqu’à ${MAX_ETAPES} étapes, numérotées dans l’ordre de la liste (glisser-déposer pour réordonner).`,
        initCollapsed: true,
      },
      fields: [
        { name: 'surtitre', label: 'Sur-titre', type: 'text' },
        { name: 'titre', label: 'Titre', type: 'text', required: true },
        { name: 'texte', label: 'Texte', type: 'textarea' },
        ...ficheFields,
        {
          name: 'boutonLibelle',
          label: 'Libellé du bouton PDF',
          type: 'text',
          admin: { description: 'Affiché seulement si l’étape a une fiche PDF. Par défaut : « Consulter la fiche (PDF) ».' },
        },
      ],
      defaultValue: [
        {
          surtitre: 'Première étape',
          titre: 'Connaître la FFRS',
          texte:
            'La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs.',
        },
        {
          surtitre: 'Le socle commun',
          titre: 'Formation Initiale des Animateurs (FIA)',
          texte:
            'Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération).',
          ficheSite: pdf('FIA'),
          boutonLibelle: 'Consulter la fiche FIA (PDF)',
        },
        {
          surtitre: 'La spécialisation',
          titre: 'Formation par activité (M2)',
          texte: 'Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2).',
        },
      ],
    },
  ],
}

const cartes: Tab = {
  label: 'Cartes',
  fields: [
    {
      name: 'cartes',
      label: 'Fiches formation par activité',
      labels: { singular: 'Carte', plural: 'Cartes' },
      type: 'array',
      maxRows: MAX_CARTES,
      admin: {
        description: `Jusqu’à ${MAX_CARTES} cartes, affichées dans l’ordre de la liste (glisser-déposer pour réordonner).`,
        initCollapsed: true,
      },
      fields: [
        { name: 'titre', label: 'Titre', type: 'text', required: true },
        { name: 'sousTitre', label: 'Sous-titre', type: 'text' },
        { name: 'icone', label: 'Pictogramme', type: 'select', options: [...ICONES] },
        {
          name: 'image',
          label: 'Pictogramme personnalisé',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Choisissez ou téléversez une image. Elle remplace le pictogramme ci-dessus ; retirez-la pour retrouver celui d’origine.' },
        },
        ...ficheFields,
      ],
      defaultValue: [
        { titre: 'Aquagym', sousTitre: 'M2-AGEF — Gymnastique Aquatique', icone: '01_aquagym.png', ficheSite: pdf('M2-AGEF') },
        { titre: 'Gymnastique', sousTitre: 'M2-AGEF — Gymnastique d’Entretien', icone: '09_gymnastique.png', ficheSite: pdf('M2-AGEF') },
        { titre: 'Danse', sousTitre: 'M2-AD — Danse de Salon', icone: '14_danse.png', ficheSite: pdf('M2-AD') },
        { titre: 'Randonnée', sousTitre: 'M2-AA — Activités de Randonnée', icone: '07_randonnee.png', ficheSite: pdf('M2-AA') },
        { titre: 'Tennis de table', sousTitre: 'M2-AC — Activités de raquettes', icone: '05_ping_pong.png', ficheSite: pdf('M2-AC') },
        { titre: 'Échecs / Jeux de société', sousTitre: 'M2-JB — Jeux de table et de société', icone: '12_echecs.png', ficheSite: pdf('M2-JB') },
      ],
    },
  ],
}

const basDePage: Tab = {
  label: 'Bas de page',
  fields: [
    {
      name: 'note',
      label: 'Note sous les fiches',
      type: 'textarea',
      defaultValue:
        'Cliquez sur « Consulter le PDF » d’une fiche pour l’afficher en grand. Vous pourrez ensuite la télécharger, l’imprimer ou zoomer.',
    },
    { name: 'ctaTitre', label: 'Titre de l’appel au contact', type: 'text', defaultValue: 'Vous souhaitez devenir animateur ?' },
    {
      name: 'ctaTexte',
      label: 'Texte de l’appel au contact',
      type: 'textarea',
      defaultValue: 'Contactez-nous pour obtenir toutes les informations sur les formations disponibles.',
    },
    { name: 'ctaBouton', label: 'Libellé du bouton', type: 'text', defaultValue: 'Nous contacter' },
  ],
}

export const Formation: GlobalConfig = {
  slug: 'formation',
  label: 'Formation',
  admin: {
    components: { elements: { beforeDocumentControls: ['/admin/VoirPage#VoirPage'] } },
    group: 'Vie du club',
    hidden: cacheSansDroit('formation'),
    description:
      'Contenu de la page Formation : étapes du parcours, cartes par activité avec leurs fiches PDF, et textes. Un texte laissé vide garde le contenu d’origine du site.',
  },
  access: {
    read: () => true,
    readVersions: peut('formation', 'voir'),
    update: peut('formation', 'modifier'),
  },
  fields: [{ type: 'tabs', tabs: [parcours, cartes, basDePage] }],
}
