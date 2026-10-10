import type { Endpoint, PayloadRequest } from 'payload'

import { AUCUN_SMTP, choisirConfigEnvoi, lireSmtp } from '../email'
import { gardeAdmin } from './gardeAdmin'

// Envoie un e-mail de test à l’administrateur connecté, avec les réglages enregistrés.
// Chemin hors de l’espace de noms du global « parametres » (cf. galerieLot).
export const smtpTest: Endpoint = {
  path: '/parametres-smtp-test',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    // L’envoi d’e-mails ne dépend pas d’un disque : on garde l’endpoint actif sur Vercel.
    const refus = gardeAdmin(req, { disque: false })
    if (refus) return refus

    const destinataire = (req.user as { email?: string } | null)?.email
    if (!destinataire) return Response.json({ error: 'Votre compte n’a pas d’adresse e-mail.' }, { status: 400 })

    try {
      const config = choisirConfigEnvoi(await lireSmtp(req.payload), process.env)
      if (!config) return Response.json({ error: AUCUN_SMTP }, { status: 400 })
      await req.payload.sendEmail({
        to: destinataire,
        subject: 'Test d’envoi — CBRS',
        text: 'Cet e-mail confirme que les réglages d’envoi du CMS CBRS fonctionnent.',
      })
      const origine = config.source === 'cms' ? 'réglages de Paramètres' : 'variables d’environnement du serveur'
      return Response.json({ message: `E-mail de test envoyé à ${destinataire} (${origine}).` })
    } catch (erreur) {
      const detail = erreur instanceof Error ? erreur.message : String(erreur)
      return Response.json({ error: `Échec de l’envoi : ${detail}` }, { status: 502 })
    }
  },
}
