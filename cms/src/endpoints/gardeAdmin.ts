import type { PayloadRequest } from 'payload'

import { estAdmin } from '../access'

// Sans disque persistant (Vercel), ni sauvegardes ni fichiers à sauvegarder.
export const NON_DISPONIBLE = 'Non disponible sur cet hébergement (pas de disque persistant).'

// Contrôle commun des endpoints sauvegardes / e-mail : connecté (401), administrateur (403),
// hébergement avec disque (409 si Vercel). Renvoie la réponse d’erreur, ou null si tout est bon.
export const gardeAdmin = (req: PayloadRequest, { disque = true }: { disque?: boolean } = {}): Response | null => {
  if (!req.user) return Response.json({ error: 'Connexion requise.' }, { status: 401 })
  if (!estAdmin(req.user)) return Response.json({ error: 'Réservé à l’administrateur.' }, { status: 403 })
  if (disque && process.env.VERCEL) return Response.json({ error: NON_DISPONIBLE }, { status: 409 })
  return null
}
