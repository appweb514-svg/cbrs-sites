import type { Field, GroupField } from 'payload'

import { SITE_PAGES } from '../sitePages'

type LienOptions = { name?: string; label?: string; description?: string }

const siType =
  (type: string) =>
  (_: unknown, siblingData: { type?: string } | undefined): boolean =>
    siblingData?.type === type

// Lien choisi dans des listes (page, activité, sortie) plutôt que saisi à la main.
// Le site le résout : page → chemin, activité → /activite?id=<slug>, sortie → /sortie?id=<id>.
export const lienField = ({ name = 'lien', label = 'Lien', description }: LienOptions = {}): GroupField => ({
  name,
  label,
  type: 'group',
  admin: { description },
  fields: [
    {
      name: 'type',
      label: 'Destination',
      type: 'radio',
      defaultValue: 'aucun',
      options: [
        { label: 'Aucun lien', value: 'aucun' },
        { label: 'Page du site', value: 'page' },
        { label: 'Activité', value: 'activite' },
        { label: 'Sortie ou voyage', value: 'sortie' },
        { label: 'Adresse externe', value: 'externe' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'page',
      label: 'Page du site',
      type: 'select',
      options: SITE_PAGES.map(({ label, value }) => ({ label, value })),
      admin: { condition: siType('page') },
    },
    {
      name: 'activite',
      label: 'Activité',
      type: 'relationship',
      relationTo: 'activites',
      admin: { condition: siType('activite') },
    },
    {
      name: 'sortie',
      label: 'Sortie ou voyage',
      type: 'relationship',
      relationTo: 'sorties',
      admin: { condition: siType('sortie') },
    },
    {
      name: 'url',
      label: 'Adresse externe',
      type: 'text',
      admin: { condition: siType('externe'), placeholder: 'https://…' },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== 'externe') return true
        return typeof value === 'string' && /^https:\/\/\S+$/.test(value)
          ? true
          : 'L’adresse doit commencer par https://'
      },
    },
  ] satisfies Field[],
})
