import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { cacheSansDroit, peut } from '../access'
import { COULEURS_ORIGINE, INTENSITE_TEINTE_ORIGINE, contrasteAvecBlanc, type NomCouleur } from '../couleurs'
import { SITE_PAGES } from '../sitePages'

// Polices testées sur le site (chargées depuis Google Fonts). « defaut » = police actuelle du site.
export const POLICES = [
  { label: 'Police d’origine du site', value: 'defaut' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Source Serif 4', value: 'Source Serif 4' },
] as const

export const validerCouleur: TextFieldSingleValidation = (value) => {
  if (!value) return true
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return 'Format attendu : #RRGGBB (ex. #0a3273).'
  const ratio = contrasteAvecBlanc(value)
  if (ratio < 4.5) {
    return `Couleur trop claire : le texte blanc ne serait pas lisible (contraste ${ratio.toFixed(1)}:1, minimum 4,5:1). Choisissez une teinte plus foncée.`
  }
  return true
}

const police = (name: string, label: string, description: string) => ({
  name,
  label,
  type: 'select' as const,
  required: true,
  defaultValue: 'defaut',
  options: POLICES.map(({ label, value }) => ({ label, value })),
  admin: { description },
})

const couleur = (name: NomCouleur, label: string, description: string) => ({
  name,
  label,
  type: 'text' as const,
  required: true,
  defaultValue: COULEURS_ORIGINE[name],
  validate: validerCouleur,
  admin: { description, placeholder: COULEURS_ORIGINE[name], components: { Field: '/admin/CouleurChamp#CouleurChamp' } },
})

export const Apparence: GlobalConfig = {
  slug: 'apparence',
  label: 'Apparence du site',
  admin: {
    group: 'Administration',
    hidden: cacheSansDroit('apparence'),
    description:
      'Polices, couleurs et en-têtes de pages. Chaque enregistrement est conservé : onglet « Versions » › « Restaurer » pour revenir en arrière.',
  },
  versions: { max: 50 },
  access: {
    read: () => true,
    update: peut('apparence', 'modifier'),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.valeursOrigine) return data
        return {
          ...data,
          ...COULEURS_ORIGINE,
          policeTitres: 'defaut',
          policeSousTitres: 'defaut',
          policeTexte: 'defaut',
          intensiteTeinte: INTENSITE_TEINTE_ORIGINE,
          imageEnTete: null,
          enTetes: [],
          valeursOrigine: false,
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Polices',
          fields: [
            police('policeTitres', 'Grands titres (H1)', 'Titre principal de chaque page.'),
            police('policeSousTitres', 'Sous-titres (H2, H3)', 'Titres des sections.'),
            police('policeTexte', 'Texte courant', 'Paragraphes, menus et boutons.'),
          ],
        },
        {
          label: 'Couleurs',
          fields: [
            couleur('couleurPrincipale', 'Couleur principale', 'Menus, titres et bandeaux (bleu d’origine).'),
            couleur('couleurSecondaire', 'Couleur secondaire', 'Tous les boutons (survol compris) et textes mis en valeur (vert d’origine).'),
            couleur('couleurAccent', 'Couleur d’accent', 'Bandeaux et détails (bleu-vert d’origine).'),
          ],
        },
        {
          label: 'En-tête',
          fields: [
            {
              name: 'apercuEnTete',
              type: 'ui',
              admin: { components: { Field: '/admin/ApercuEnTete#ApercuEnTete' } },
            },
            {
              name: 'imageEnTete',
              label: 'Image d’en-tête par défaut',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Image du bandeau de toutes les pages. L’image propre à une page (onglet « En-têtes de pages ») reste prioritaire.',
              },
            },
            couleur('teinteEnTete', 'Teinte de l’en-tête', 'Voile posé sur l’image pour garder le texte blanc lisible (bleu d’origine).'),
            {
              name: 'intensiteTeinte',
              label: 'Intensité de la teinte',
              type: 'number',
              required: true,
              defaultValue: INTENSITE_TEINTE_ORIGINE,
              validate: (value: unknown) =>
                value === null ||
                value === undefined ||
                (typeof value === 'number' && value >= 0 && value <= 100) ||
                'Indiquez un pourcentage entre 0 et 100.',
              admin: {
                description: 'Opacité du voile : 0 % laisse l’image nette, 100 % la rend opaque.',
                components: { Field: '/admin/PourcentageChamp#PourcentageChamp' },
              },
            },
          ],
        },
        {
          label: 'En-têtes de pages',
          fields: [
            {
              name: 'enTetes',
              label: 'En-têtes personnalisés',
              labels: { singular: 'En-tête', plural: 'En-têtes' },
              type: 'array',
              admin: {
                description: 'Remplace le titre, le sous-titre ou l’image d’en-tête d’une page. Champ vide = contenu actuel conservé.',
              },
              validate: (value: unknown) => {
                const pages = ((value as { page?: string }[] | null) ?? []).map((e) => e.page)
                return new Set(pages).size === pages.length ? true : 'Chaque page ne peut avoir qu’un seul en-tête.'
              },
              fields: [
                {
                  name: 'page',
                  label: 'Page',
                  type: 'select',
                  required: true,
                  options: SITE_PAGES.map(({ label, value }) => ({ label, value })),
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'titre', label: 'Titre', type: 'text', maxLength: 90 },
                    { name: 'sousTitre', label: 'Sous-titre', type: 'text', maxLength: 240 },
                  ],
                },
                { name: 'image', label: 'Image d’en-tête', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'valeursOrigine',
      label: 'Revenir à l’apparence d’origine au prochain enregistrement',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
