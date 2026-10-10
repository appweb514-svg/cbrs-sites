import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { Payload } from 'payload'

export const dossierSauvegardes = (): string =>
  path.resolve(process.env.CBRS_SAUVEGARDES_DIR || path.resolve(os.homedir(), 'backups/auto'))

export type Source = { nom: string; chemin: string }

const dossierUpload = (payload: Payload, slug: string): string => {
  const collection = payload.config.collections.find((c) => c.slug === slug)
  const staticDir = typeof collection?.upload === 'object' ? collection.upload.staticDir : undefined
  return path.resolve(staticDir || path.resolve(process.cwd(), slug))
}

// Dossiers à sauvegarder (ceux qui existent). Jamais le fichier .env.
export const sources = (payload: Payload): Source[] =>
  [
    { nom: 'media', chemin: dossierUpload(payload, 'media') },
    { nom: 'documents', chemin: dossierUpload(payload, 'documents') },
    { nom: 'www', chemin: path.resolve(process.env.CBRS_WWW_DIR || path.resolve(process.cwd(), '../www')) },
    {
      nom: 'api-public',
      chemin: path.resolve(process.env.CBRS_API_PUBLIC_DIR || path.resolve(process.cwd(), '../api-public')),
    },
  ].filter(({ chemin }) => existsSync(chemin))
