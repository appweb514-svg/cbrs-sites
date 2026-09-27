import type { CollectionConfig } from 'payload'

import { accesSection, afficheOuEditeur, cacheSansDroit } from '../access'

// Mêmes catégories et activités que les filtres de site3/galerie.html.
export const CATEGORIES_GALERIE = [
  { label: 'Activités sportives', value: 'sport' },
  { label: 'Sorties', value: 'sortie' },
  { label: 'Vie du club', value: 'vie' },
] as const

export const ACTIVITES_GALERIE = [
  { label: 'Marche nordique', value: 'marche-nordique' },
  { label: 'Tai Chi', value: 'tai-chi' },
  { label: 'Randonnée', value: 'randonnee' },
  { label: 'Gymnastique', value: 'gymnastique' },
  { label: 'Tennis de table', value: 'tennis-de-table' },
  { label: 'Danse', value: 'danse' },
  { label: 'Cyclisme', value: 'cyclisme' },
  { label: 'Aquagym', value: 'aquagym' },
  { label: 'Pétanque', value: 'petanque' },
  { label: 'Tennis', value: 'tennis' },
  { label: 'Atelier mémoire', value: 'atelier-memoire' },
  { label: 'Autres activités', value: 'autres-sport' },
  { label: 'Autres sorties', value: 'autres-sorties' },
  { label: 'Vie du club', value: 'vie-club' },
  { label: 'Autres', value: 'autres' },
] as const

export const Galerie: CollectionConfig = {
  slug: 'galerie',
  labels: { singular: 'Photo de galerie', plural: 'Galerie' },
  admin: {
    useAsTitle: 'legende',
    defaultColumns: ['photo', 'legende', 'categorie', 'activite', 'annee', 'afficherSurSite'],
    group: 'Médiathèque',
    hidden: cacheSansDroit('galerie'),
    description:
      'Page « Galerie photo » du site. Glissez les photos (poignée à gauche) pour changer leur ordre sur le site ; cochez-en plusieurs puis « Modifier » pour changer l’année ou la catégorie d’un coup.',
    pagination: { defaultLimit: 100 },
  },
  // Ordre du site modifiable par glisser-déposer dans la liste.
  orderable: true,
  defaultSort: '_order',
  access: accesSection('galerie', afficheOuEditeur('galerie')),
  fields: [
    { name: 'photo', label: 'Photo', type: 'upload', relationTo: 'media', required: true },
    { name: 'legende', label: 'Légende', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'annee', label: 'Année', type: 'number', required: true, min: 1990, max: 2100 },
        {
          name: 'categorie',
          label: 'Catégorie',
          type: 'select',
          required: true,
          defaultValue: 'vie',
          options: CATEGORIES_GALERIE.map(({ label, value }) => ({ label, value })),
        },
        {
          name: 'activite',
          label: 'Activité ou thème',
          type: 'select',
          defaultValue: 'autres',
          options: ACTIVITES_GALERIE.map(({ label, value }) => ({ label, value })),
        },
      ],
    },
    { name: 'album', label: 'Album', type: 'text', admin: { description: 'Facultatif, ex. : Sortie au Touquet 2026.' } },
    {
      name: 'fichierOrigine',
      label: 'Fichier d’origine',
      type: 'text',
      index: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Renseigné par l’import des photos du site.' },
    },
    {
      name: 'afficherSurSite',
      label: 'Afficher sur le site',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
