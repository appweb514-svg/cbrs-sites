import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { accesSection, afficheOuEditeur, cacheSansDroit } from '../access'

// Formats acceptés pour les documents déposés.
// Payload compare le type DÉTECTÉ dans le contenu, pas l'extension : les .doc et .xls
// enregistrés par les anciennes versions d'Office sont des conteneurs OLE2, détectés
// « application/x-cfb ». Sans cette entrée, ils sont refusés malgré « application/msword ».
const MIME_DOCUMENTS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/x-cfb',
]

// Un formulaire ouvert avant un remplacement (ou un retour en arrière) renvoie l'ancien nom de
// fichier : sans nouveau fichier, on garde le nom déjà enregistré, sinon le document pointerait
// vers un fichier supprimé.
const garderNomFichier: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (req.file || !data?.filename || !originalDoc?.filename) return data
  if (data.filename === originalDoc.filename) return data
  return { ...data, filename: originalDoc.filename }
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents' },
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'remplaceLienOfficiel', 'afficherSurSite', 'updatedAt'],
    group: 'Photos & documents',
    hidden: cacheSansDroit('documents'),
    description:
      'Documents du club (PDF, Word, Excel, OpenDocument), listés sur la page « Liens utiles et documents ». Un document ne remplace un lien officiel (statuts, fiche d’adhésion…) que si vous le choisissez.',
  },
  defaultSort: 'ordre',
  access: accesSection('documents', afficheOuEditeur('documents')),
  hooks: { beforeChange: [garderNomFichier] },
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
  upload: { mimeTypes: MIME_DOCUMENTS },
}
