import path from 'node:path'

import { getFileByPath } from 'payload'
import type { Endpoint, PayloadRequest } from 'payload'

import { droits } from '../access'
import { assainirNom, NOM_MAX, separerNom } from '../nomFichier'

// Relit les octets de la photo : disque local quand le stockage est local, sinon son URL
// (stockage Vercel Blob en production).
const lireFichier = async (req: PayloadRequest, filename: string, url?: null | string) => {
  const { upload } = req.payload.collections.media.config
  const staticDir = typeof upload === 'object' && !upload.disableLocalStorage ? upload.staticDir : undefined
  if (staticDir) {
    const fichier = await getFileByPath(path.resolve(staticDir, filename)).catch(() => undefined)
    if (fichier) return fichier
  }
  if (!url) return undefined
  try {
    const base = req.origin || req.payload.config.serverURL || 'http://localhost'
    const reponse = await fetch(new URL(url, base).href)
    if (!reponse.ok) return undefined
    const data = Buffer.from(await reponse.arrayBuffer())
    return { data, mimetype: reponse.headers.get('content-type') ?? undefined, name: filename, size: data.length }
  } catch {
    return undefined
  }
}

// Renomme une photo sans toucher à son extension : le nom est nettoyé, l'extension d'origine conservée,
// puis le fichier est réécrit avec ses tailles. Chemin hors de l'espace de noms de la collection « media ».
export const mediaRenommer: Endpoint = {
  path: '/media-renommer',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return Response.json({ error: 'Connexion requise.' }, { status: 401 })
    if (!droits(req.user, 'media', 'modifier').autorise) {
      return Response.json({ error: 'Droit « modifier » manquant sur les photos.' }, { status: 403 })
    }

    let corps: { id?: unknown; nom?: unknown } = {}
    try {
      corps = ((await req.json?.()) ?? {}) as typeof corps
    } catch {
      return Response.json({ error: 'Requête illisible.' }, { status: 400 })
    }

    const id = Number(corps.id)
    const base = assainirNom(String(corps.nom ?? ''))
    if (!Number.isInteger(id) || id <= 0 || base.length < 1 || base.length > NOM_MAX) {
      return Response.json({ error: `Nom de fichier invalide (1 à ${NOM_MAX} caractères).` }, { status: 400 })
    }

    let photo
    try {
      photo = await req.payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    } catch {
      return Response.json({ error: 'Photo introuvable.' }, { status: 404 })
    }
    if (!photo?.filename) return Response.json({ error: 'Photo introuvable.' }, { status: 404 })

    const nom = `${base}${separerNom(photo.filename).extension}`
    if (nom === photo.filename) return Response.json({ filename: nom })

    const fichier = await lireFichier(req, photo.filename, photo.url)
    if (!fichier) return Response.json({ error: 'Fichier introuvable sur le stockage.' }, { status: 404 })

    try {
      const misAJour = await req.payload.update({
        collection: 'media',
        id,
        data: {},
        file: {
          data: fichier.data,
          mimetype: fichier.mimetype || photo.mimeType || 'application/octet-stream',
          name: nom,
          size: fichier.data.length,
        },
        overrideAccess: true,
      })
      return Response.json({ filename: misAJour.filename })
    } catch {
      return Response.json({ error: 'Renommage impossible.' }, { status: 500 })
    }
  },
}
