import type { GlobalConfig, GroupField, Tab } from 'payload'

import { cacheSansDroit, peut } from '../access'

const etape = (name: string, label: string, surtitre: string, titre: string, texte: string): GroupField => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'surtitre', label: 'Sur-titre', type: 'text', defaultValue: surtitre },
    { name: 'titre', label: 'Titre', type: 'text', defaultValue: titre },
    { name: 'texte', label: 'Texte', type: 'textarea', defaultValue: texte },
  ],
})

const carte = (name: string, label: string, titre: string, sousTitre: string): GroupField => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'titre', label: 'Titre', type: 'text', defaultValue: titre },
    { name: 'sousTitre', label: 'Sous-titre', type: 'text', defaultValue: sousTitre },
  ],
})

const fiche = (name: string, label: string): { name: string; label: string; type: 'upload'; relationTo: 'documents' } => ({
  name,
  label,
  type: 'upload',
  relationTo: 'documents',
})

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
    etape(
      'etape1',
      'Étape 1',
      'Première étape',
      'Connaître la FFRS',
      'La Fédération Française de la Retraite Sportive (FFRS) est l’organisme fédéral qui encadre et forme les animateurs.',
    ),
    etape(
      'etape2',
      'Étape 2',
      'Le socle commun',
      'Formation Initiale des Animateurs (FIA)',
      'Première étape incontournable : la FIA vous forme aux bases de l’animation sportive bénévole (pédagogie, sécurité, connaissance de la fédération).',
    ),
    etape(
      'etape3',
      'Étape 3',
      'La spécialisation',
      'Formation par activité (M2)',
      'Après la FIA, vous suivez la formation spécifique à l’activité que vous souhaitez encadrer (M2).',
    ),
  ],
}

const fiches: Tab = {
  label: 'Fiches PDF',
  description: 'Choisissez un PDF de la médiathèque Documents. Laissez vide pour garder le fichier livré avec le site.',
  fields: [
    fiche('ficheFia', 'Fiche FIA (Formation Initiale des Animateurs)'),
    fiche('ficheM2Agef', 'Fiche M2-AGEF (Aquagym et Gymnastique)'),
    fiche('ficheM2Ad', 'Fiche M2-AD (Danse)'),
    fiche('ficheM2Aa', 'Fiche M2-AA (Randonnée)'),
    fiche('ficheM2Ac', 'Fiche M2-AC (Tennis de table)'),
    fiche('ficheM2Jb', 'Fiche M2-JB (Échecs et jeux de société)'),
  ],
}

const cartes: Tab = {
  label: 'Cartes',
  fields: [
    carte('carteAg', 'Aquagym', 'Aquagym', 'M2-AGEF — Gymnastique Aquatique'),
    carte('carteGym', 'Gymnastique', 'Gymnastique', 'M2-AGEF — Gymnastique d’Entretien'),
    carte('carteDanse', 'Danse', 'Danse', 'M2-AD — Danse de Salon'),
    carte('carteRando', 'Randonnée', 'Randonnée', 'M2-AA — Activités de Randonnée'),
    carte('carteRaquettes', 'Tennis de table', 'Tennis de table', 'M2-AC — Activités de raquettes'),
    carte('carteEchecs', 'Échecs / Jeux de société', 'Échecs / Jeux de société', 'M2-JB — Jeux de table et de société'),
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
    group: 'Vie du club',
    hidden: cacheSansDroit('formation'),
    description:
      'Contenu de la page Formation : parcours, fiches PDF et textes. Laissez un champ vide pour garder le contenu d’origine du site.',
  },
  access: {
    read: () => true,
    readVersions: peut('formation', 'voir'),
    update: peut('formation', 'modifier'),
  },
  fields: [{ type: 'tabs', tabs: [parcours, fiches, cartes, basDePage] }],
}
