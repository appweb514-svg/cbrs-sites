import type { CollectionConfig } from 'payload'

import { accesSection, afficheOuEditeur, cacheSansDroit } from '../access'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents (PDF)' },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'remplaceLienOfficiel', 'afficherSurSite', 'updatedAt'],
    group: 'Vie associative',
    hidden: cacheSansDroit('documents'),
    description:
      'Documents listés sur la page « Liens utiles et documents ». Un document ne remplace un lien officiel (statuts, fiche d’adhésion…) que si vous le choisissez.',
  },
  defaultSort: 'ordre',
  access: accesSection('documents', afficheOuEditeur('documents')),
  fields: [
    { name: 'titre', label: 'Titre', type: 'text', required: true },
    {
      name: 'categorie',
      label: 'Catégorie',
      type: 'select',
      required: true,
      defaultValue: 'autre',
      options: [
        { label: 'Adhésion', value: 'adhesion' },
        { label: 'Vie associative', value: 'vie-associative' },
        { label: 'Formations', value: 'formations' },
        { label: 'Assurance', value: 'assurance' },
        { label: 'Autre', value: 'autre' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'remplaceLienOfficiel',
      label: 'Remplace le lien officiel',
      type: 'select',
      required: true,
      defaultValue: 'aucun',
      options: [
        { label: 'Aucun (simple document de la liste)', value: 'aucun' },
        { label: 'Statuts (page Statuts)', value: 'statuts' },
        { label: 'Règlement intérieur (page Statuts)', value: 'reglement' },
        { label: 'Fiche d’adhésion (page Adhésion)', value: 'adhesion' },
        { label: 'Déclaration d’assurance (page Liens utiles)', value: 'assurance' },
        { label: 'Imprimé fédéral (page Liens utiles)', value: 'federal' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Le plus récent document choisi pour un lien officiel remplace le fichier actuel du site.',
      },
    },
    {
      name: 'afficherSurSite',
      label: 'Afficher dans la liste des documents',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    { name: 'ordre', label: 'Ordre', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
  upload: { mimeTypes: ['application/pdf'] },
}
