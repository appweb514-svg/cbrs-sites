import type { Field } from 'payload'

import { isAdminField } from '../access'
import { MASQUE, chiffrer, estChiffre } from '../secret'

// Contexte Payload demandant la valeur chiffrée telle qu’enregistrée (lecture interne, sans masque).
export const CONTEXTE_BRUT = 'secretBrut'

type Options = {
  label: string
  description?: string
  multiligne?: boolean
  condition?: (data: unknown, sibling: Record<string, unknown>) => boolean
}

const valeurALaPath = (objet: unknown, chemin: (string | number)[]): unknown =>
  chemin.reduce<unknown>((courant, cle) => (courant as Record<string, unknown> | undefined)?.[cle], objet)

// Champ secret : chiffré à l’enregistrement, jamais renvoyé en clair (MASQUE s’il existe).
// Vide ou MASQUE à l’enregistrement = conserver la valeur actuelle.
export const champSecret = (name: string, { label, description, multiligne, condition }: Options): Field => ({
  name,
  label,
  type: multiligne ? 'textarea' : 'text',
  access: { read: isAdminField, update: isAdminField },
  admin: {
    description: `${description ? `${description} ` : ''}Enregistré chiffré. Laissez tel quel pour conserver la valeur actuelle.`,
    autoComplete: 'off',
    condition,
  },
  hooks: {
    beforeChange: [
      async ({ value, path, req }) => {
        const saisi = typeof value === 'string' ? value.trim() : ''
        if (saisi && saisi !== MASQUE) return estChiffre(saisi) ? saisi : chiffrer(saisi)
        // Conserver l’ancienne valeur chiffrée, lue sans masque.
        const actuel = await req.payload.findGlobal({
          slug: 'parametres',
          depth: 0,
          overrideAccess: true,
          context: { [CONTEXTE_BRUT]: true },
        })
        const ancien = valeurALaPath(actuel, path as (string | number)[])
        return typeof ancien === 'string' ? ancien : ''
      },
    ],
    afterRead: [
      ({ value, context }) => {
        if (context?.[CONTEXTE_BRUT]) return value
        return typeof value === 'string' && value ? MASQUE : ''
      },
    ],
  },
}) as Field