import type { CollectionConfig } from 'payload'

import { accesSection, cacheSansDroit, publieOuEditeur, verifierPublication } from '../access'

export const Activites: CollectionConfig = {
  slug: 'activites',
  labels: { singular: 'Activité', plural: 'Activités' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'ordre', '_status'],
    group: 'Activités & sorties',
    components: { edit: { beforeDocumentControls: ['/admin/VoirPage#VoirPage'] } },
    hidden: cacheSansDroit('activites'),
    description:
      'Pages « Activités » et fiches du site. Une activité dépubliée (ou en brouillon seulement) disparaît du site.',
  },
  defaultSort: 'ordre',
  versions: { drafts: true },
  access: accesSection('activites', publieOuEditeur('activites')),
  hooks: { beforeChange: [verifierPublication('activites')] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Présentation',
          fields: [
            { name: 'nom', label: 'Nom de l’activité', type: 'text', required: true },
            {
              name: 'description',
              label: 'Description courte',
              type: 'textarea',
              required: true,
              maxLength: 240,
              admin: { description: 'Affichée sur la carte de la page Activités et sous le titre de la fiche.' },
            },
            {
              name: 'presentation',
              label: 'Texte de présentation',
              type: 'textarea',
              admin: {
                rows: 8,
                description:
                  'Bloc « Présentation » de la fiche, sous le titre. Laisser une ligne vide entre deux paragraphes. Si ce champ est vide, la description courte est affichée à la place.',
              },
            },
            { name: 'niveau', label: 'Niveau', type: 'text', admin: { placeholder: 'Tous niveaux' } },
            {
              type: 'row',
              fields: [
                { name: 'icone', label: 'Logo', type: 'upload', relationTo: 'media' },
                {
                  name: 'photo',
                  label: 'Photo principale',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Affichée en 16:9 sous le texte de présentation (format paysage conseillé).' },
                },
              ],
            },
            {
              name: 'photos',
              label: 'Galerie de l’activité',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'Vignettes sous la photo principale ; un clic les agrandit.' },
            },
            {
              name: 'bonASavoir',
              label: 'Bon à savoir',
              type: 'group',
              admin: {
                description: 'Encadré affiché à droite de la présentation. Laisser vide ce qui ne s’applique pas ; l’encadré est masqué si tout est vide ou si la case est décochée.',
              },
              fields: [
                {
                  name: 'afficher',
                  label: 'Afficher l’encadré « Bon à savoir » sur la fiche',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  type: 'row',
                  admin: { condition: (_, groupe) => groupe?.afficher !== false },
                  fields: [
                    { name: 'tenue', label: 'Tenue', type: 'text', admin: { placeholder: 'Tenue de sport, baskets propres' } },
                    { name: 'materiel', label: 'Matériel à prévoir', type: 'text', admin: { placeholder: 'Tapis, bouteille d’eau' } },
                  ],
                },
                {
                  type: 'row',
                  admin: { condition: (_, groupe) => groupe?.afficher !== false },
                  fields: [
                    {
                      name: 'intensite',
                      label: 'Effort',
                      type: 'select',
                      options: [
                        { label: 'Doux', value: 'douce' },
                        { label: 'Modéré', value: 'moderee' },
                        { label: 'Soutenu', value: 'soutenue' },
                      ],
                    },
                    { name: 'duree', label: 'Durée d’une séance', type: 'text', admin: { placeholder: '1 h 30' } },
                    { name: 'prix', label: 'Prix', type: 'text', admin: { placeholder: 'Compris dans l’adhésion' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Horaires et lieu',
          fields: [
            {
              name: 'creneaux',
              label: 'Créneaux',
              labels: { singular: 'Créneau', plural: 'Créneaux' },
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'jour',
                      label: 'Jour',
                      type: 'select',
                      required: true,
                      options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Voir planning'],
                    },
                    { name: 'horaire', label: 'Horaire', type: 'text', required: true, admin: { placeholder: '9h-12h' } },
                    { name: 'lieu', label: 'Lieu', type: 'text', required: true },
                  ],
                },
              ],
            },
            { name: 'pointRencontre', label: 'Point de rendez-vous', type: 'text' },
            {
              name: 'carte',
              label: 'Carte',
              type: 'group',
              admin: {
                description: 'Position du point de rendez-vous. Laisser vide pour la détecter à partir du lieu.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'lieu', label: 'Nom du lieu', type: 'text' },
                    { name: 'lat', label: 'Latitude', type: 'number', min: -90, max: 90 },
                    { name: 'lon', label: 'Longitude', type: 'number', min: -180, max: 180 },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Animateurs et infos',
          fields: [
            {
              name: 'animateurs',
              label: 'Animateurs',
              labels: { singular: 'Animateur', plural: 'Animateurs' },
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'nom', label: 'Prénom et nom', type: 'text', required: true },
                    { name: 'photo', label: 'Photo (accord écrit requis)', type: 'upload', relationTo: 'media' },
                  ],
                },
              ],
            },
            {
              name: 'infos',
              label: 'Infos pratiques',
              labels: { singular: 'Info', plural: 'Infos pratiques' },
              type: 'array',
              fields: [{ name: 'texte', label: 'Texte', type: 'text', required: true }],
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      label: 'Identifiant de page (ne pas modifier)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Adresse de la fiche : /activite?id=<identifiant>. La changer casse les liens existants.',
      },
    },
    {
      name: 'ordre',
      label: 'Ordre d’affichage',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar' },
    },
  ],
}
