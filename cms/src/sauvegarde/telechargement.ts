import { spawn } from 'node:child_process'
import { mkdtemp, rm, symlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'

import type { Payload } from 'payload'

import { sauvegarderBase } from './base'
import { sources } from './chemins'

const jour = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// Archive zip complète en flux : base + médias + documents + site + API publique.
// Le dossier temporaire (dump + liens vers les dossiers sources) est supprimé à la fin du flux.
export const archiveZip = async (payload: Payload): Promise<Response> => {
  const temporaire = await mkdtemp(path.join(os.tmpdir(), 'cbrs-sauvegarde-'))
  const nettoyer = () => void rm(temporaire, { recursive: true, force: true })
  try {
    await sauvegarderBase(temporaire)
    for (const { nom, chemin } of sources(payload)) await symlink(chemin, path.join(temporaire, nom))

    // zip suit les liens symboliques (sans -y) : l’archive contient les vrais fichiers.
    const zip = spawn('zip', ['-r', '-q', '-', '.', '-x', '.env', '*/.env'], {
      cwd: temporaire,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    await new Promise<void>((resolve, reject) => {
      zip.once('spawn', () => resolve())
      zip.once('error', (e: NodeJS.ErrnoException) =>
        reject(new Error(e.code === 'ENOENT' ? '« zip » n’est pas installé sur ce serveur.' : e.message)),
      )
    })
    zip.on('close', nettoyer)
    // Navigateur qui abandonne le téléchargement : on arrête zip.
    zip.stdout.on('close', () => zip.kill())

    return new Response(Readable.toWeb(zip.stdout) as ReadableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="cbrs-sauvegarde-${jour(new Date())}.zip"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    nettoyer()
    throw e
  }
}
