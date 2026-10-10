import type { Endpoint, PayloadRequest } from 'payload'

import { CONTEXTE_BRUT } from '../fields/champSecret'
import { lireEtat } from '../sauvegarde/etat'
import { lancerPassage, passageEnCours, testerExterne } from '../sauvegarde/passage'
import { archiveZip } from '../sauvegarde/telechargement'
import { gardeAdmin } from './gardeAdmin'

// Chemins hors de l’espace de noms du global « parametres » (cf. galerieLot).

export const sauvegardeTelecharger: Endpoint = {
  path: '/sauvegardes/telecharger',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const refus = gardeAdmin(req)
    if (refus) return refus
    try {
      return await archiveZip(req.payload)
    } catch (e) {
      return Response.json({ error: `Sauvegarde impossible : ${(e as Error).message}` }, { status: 500 })
    }
  },
}

export const sauvegardeLancer: Endpoint = {
  path: '/sauvegardes/lancer',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const refus = gardeAdmin(req)
    if (refus) return refus
    if (passageEnCours()) return Response.json({ error: 'Une sauvegarde est déjà en cours.' }, { status: 409 })
    // En arrière-plan : la réponse part tout de suite, l’avancement se lit dans l’état.
    void lancerPassage(req.payload)
    return Response.json({ message: 'Sauvegarde lancée.' }, { status: 202 })
  },
}

export const sauvegardeEtat: Endpoint = {
  path: '/sauvegardes/etat',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const refus = gardeAdmin(req)
    if (refus) return refus
    const etat = await lireEtat()
    return Response.json({ ...etat, statut: passageEnCours() ? 'encours' : etat.statut === 'encours' ? 'erreur' : etat.statut })
  },
}

export const sauvegardeTestExterne: Endpoint = {
  path: '/sauvegardes/test-externe',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const refus = gardeAdmin(req)
    if (refus) return refus
    try {
      const parametres = await req.payload.findGlobal({
        slug: 'parametres',
        depth: 0,
        overrideAccess: true,
        context: { [CONTEXTE_BRUT]: true },
      })
      const message = await testerExterne(parametres.sauvegarde?.externe ?? {})
      return Response.json({ message })
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 502 })
    }
  },
}
