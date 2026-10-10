import type { Payload } from 'payload'

import { lireEtat } from './etat'
import { lireReglages, lancerPassage } from './passage'

// Dernière échéance (jour de semaine 0 = dimanche, heure pleine) qui ne dépasse pas `maintenant`.
export const derniereEcheance = (maintenant: Date, jour: number, heure: number): Date => {
  const echeance = new Date(maintenant)
  echeance.setHours(heure, 0, 0, 0)
  echeance.setDate(echeance.getDate() - ((echeance.getDay() - jour + 7) % 7))
  if (echeance > maintenant) echeance.setDate(echeance.getDate() - 7)
  return echeance
}

// Une sauvegarde est due si la dernière tentative (ou, à défaut, le démarrage du CMS)
// est antérieure à la dernière échéance : une seule tentative par semaine.
export const sauvegardeDue = (args: { maintenant: Date; derniereTentative: Date; jour: number; heure: number }): boolean =>
  args.derniereTentative < derniereEcheance(args.maintenant, args.jour, args.heure)

const INTERVALLE_MS = 10 * 60_000

declare global {
  var __cbrsSauvegardeMinuteur: NodeJS.Timeout | undefined
}

// Contrôle toutes les 10 minutes si la sauvegarde hebdomadaire est due.
// Uniquement avec CBRS_SAUVEGARDES=1 (jamais sur Vercel, jamais en test).
export const demarrerPlanification = (payload: Payload): void => {
  if (process.env.CBRS_SAUVEGARDES !== '1' || process.env.VERCEL) return
  if (globalThis.__cbrsSauvegardeMinuteur) clearInterval(globalThis.__cbrsSauvegardeMinuteur)
  const demarrage = new Date()
  globalThis.__cbrsSauvegardeMinuteur = setInterval(async () => {
    try {
      const reglages = await lireReglages(payload)
      if (!reglages.actif) return
      const etat = await lireEtat()
      const derniereTentative = etat.debut ? new Date(etat.debut) : demarrage
      if (sauvegardeDue({ maintenant: new Date(), derniereTentative, jour: reglages.jour, heure: reglages.heure })) {
        await lancerPassage(payload)
      }
    } catch (e) {
      payload.logger.error(`Planification des sauvegardes : ${(e as Error).message}`)
    }
  }, INTERVALLE_MS)
  globalThis.__cbrsSauvegardeMinuteur.unref()
  payload.logger.info('Sauvegarde hebdomadaire activée (CBRS_SAUVEGARDES=1).')
}
