import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { dossierSauvegardes } from './chemins'

// Historique du dernier passage, gardé dans un petit fichier à côté des instantanés
// (lisible même si la base est indisponible, et sans multiplier les versions des Paramètres).
export type Etat = {
  statut?: 'encours' | 'ok' | 'erreur'
  debut?: string
  fin?: string
  taille?: number
  instantane?: string
  message?: string
  externe?: { statut: 'ok' | 'erreur' | 'aucun'; message?: string }
}

const fichier = () => path.join(dossierSauvegardes(), 'etat.json')

export const lireEtat = async (): Promise<Etat> => {
  try {
    return JSON.parse(await readFile(fichier(), 'utf8')) as Etat
  } catch {
    return {}
  }
}

export const ecrireEtat = async (etat: Etat): Promise<void> => {
  await mkdir(dossierSauvegardes(), { recursive: true })
  const temporaire = `${fichier()}.tmp`
  await writeFile(temporaire, JSON.stringify(etat, null, 2))
  await rename(temporaire, fichier())
}
