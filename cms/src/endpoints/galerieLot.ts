import type { Endpoint, PayloadRequest } from 'payload'

import { droits } from '../access'

// Ajoute ou retire des photos de la galerie du site, par lots (depuis la photothèque ou la galerie).
// Reçoit des identifiants de photos (média) ; la galerie n'est qu'une mise en avant de la photothèque.
// Chemin hors de l'espace de noms de la collection « galerie » : sinon Payload l'interprète
// comme un findByID sur l'identifiant « lot ».
export const galerieLot: Endpoint = {
  path: '/galerie-lot',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) return Response.json({ error: 'Connexion requise.' }, { status: 401 })

    const peutCreer = droits(req.user, 'galerie', 'creer').autorise
    const peutSupprimer = droits(req.user, 'galerie', 'supprimer').autorise

    let corps: { ajouter?: unknown; retirer?: unknown } = {}
    try {
      corps = ((await req.json?.()) ?? {}) as typeof corps
    } catch {
      return Response.json({ error: 'Requête illisible.' }, { status: 400 })
    }
    const identifiants = (valeur: unknown) => (Array.isArray(valeur) ? valeur.filter((v) => v != null) : [])
    const ajouter = identifiants(corps.ajouter)
    const retirer = identifiants(corps.retirer)

    if (ajouter.length && !peutCreer) return Response.json({ error: 'Droit « créer » manquant sur la galerie.' }, { status: 403 })
    if (retirer.length && !peutSupprimer) {
      return Response.json({ error: 'Droit « supprimer » manquant sur la galerie.' }, { status: 403 })
    }

    let ajoutes = 0
    let dejaPresentes = 0
    let retires = 0
    const erreurs: string[] = []
    const anneeCourante = new Date().getFullYear()

    for (const photo of ajouter) {
      try {
        const deja = await req.payload.count({ collection: 'galerie', where: { photo: { equals: photo } }, overrideAccess: true })
        if (deja.totalDocs) {
          dejaPresentes++
          continue
        }
        const media = await req.payload.findByID({ collection: 'media', id: photo as number, depth: 0, overrideAccess: true })
        const annee = Number(String(media?.createdAt ?? '').slice(0, 4)) || anneeCourante
        await req.payload.create({
          collection: 'galerie',
          data: {
            photo: photo as number,
            annee,
            categorie: 'vie',
            legende: media?.alt ?? undefined,
            afficherSurSite: true,
          },
          overrideAccess: true,
        })
        ajoutes++
      } catch {
        erreurs.push(`Photo ${photo} : ajout impossible.`)
      }
    }

    if (retirer.length) {
      try {
        const entrees = await req.payload.find({
          collection: 'galerie',
          where: { photo: { in: retirer as number[] } },
          limit: 0,
          depth: 0,
          overrideAccess: true,
        })
        for (const entree of entrees.docs) {
          await req.payload.delete({ collection: 'galerie', id: entree.id, overrideAccess: true })
          retires++
        }
      } catch {
        erreurs.push('Retrait impossible pour certaines photos.')
      }
    }

    return Response.json({ ajoutes, dejaPresentes, retires, erreurs })
  },
}
