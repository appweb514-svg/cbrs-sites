import type { GlobalConfig } from 'payload'

import { hiddenUnless, isAdmin } from '../access'

export const Parametres: GlobalConfig = {
  slug: 'parametres',
  label: 'Paramètres du site',
  admin: {
    group: 'Administration',
    hidden: hiddenUnless('admin'),
    description: 'Chiffres clés et adresses de contact affichés sur le site. Réservé à l’administrateur.',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'depuis', label: 'Club fondé en', type: 'text', defaultValue: '1993' },
        { name: 'adherents', label: 'Adhérents', type: 'text', defaultValue: '1 200' },
        { name: 'activites', label: 'Activités', type: 'text', defaultValue: '≈ 20' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'emailContact',
          label: 'E-mail contact',
          type: 'email',
          defaultValue: 'cbrs@cbrs60.fr',
        },
        {
          name: 'emailSorties',
          label: 'E-mail sorties & voyages',
          type: 'email',
          defaultValue: 'martinelcbrs60@gmail.com',
        },
      ],
    },
  ],
}
