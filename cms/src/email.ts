import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, Payload } from 'payload'

import { CONTEXTE_BRUT } from './fields/champSecret'
import { dechiffrer } from './secret'

export type ReglagesSmtp = {
  actif?: boolean | null
  hote?: string | null
  port?: number | null
  securise?: boolean | null
  utilisateur?: string | null
  motDePasse?: string | null
  expediteur?: string | null
  nomExpediteur?: string | null
}

export type ConfigEnvoi = {
  source: 'cms' | 'env'
  hote: string
  port: number
  securise: boolean
  utilisateur?: string
  motDePasse?: string
  expediteur: string
  nomExpediteur: string
}

const DEFAUT_EXPEDITEUR = 'no-reply@cbrs60.fr'

// Réglages saisis dans Paramètres s’ils sont activés, sinon variables d’environnement SMTP_*, sinon rien.
export const choisirConfigEnvoi = (smtp: ReglagesSmtp | null | undefined, env: Record<string, string | undefined>): ConfigEnvoi | null => {
  if (smtp?.actif && smtp.hote?.trim()) {
    return {
      source: 'cms',
      hote: smtp.hote.trim(),
      port: smtp.port || 587,
      securise: Boolean(smtp.securise),
      utilisateur: smtp.utilisateur?.trim() || undefined,
      motDePasse: smtp.motDePasse ? dechiffrer(smtp.motDePasse) : undefined,
      expediteur: smtp.expediteur?.trim() || env.SMTP_FROM || DEFAUT_EXPEDITEUR,
      nomExpediteur: smtp.nomExpediteur?.trim() || 'CBRS',
    }
  }
  if (env.SMTP_HOST) {
    const port = Number(env.SMTP_PORT || 587)
    return {
      source: 'env',
      hote: env.SMTP_HOST,
      port,
      securise: port === 465,
      utilisateur: env.SMTP_USER || undefined,
      motDePasse: env.SMTP_USER ? env.SMTP_PASS || '' : undefined,
      expediteur: env.SMTP_FROM || DEFAUT_EXPEDITEUR,
      nomExpediteur: 'CBRS',
    }
  }
  return null
}

// Lecture interne du réglage SMTP (secret chiffré tel qu’enregistré ; il est déchiffré à l’envoi).
export const lireSmtp = async (payload: Payload): Promise<ReglagesSmtp | undefined> => {
  const parametres = await payload.findGlobal({
    slug: 'parametres',
    depth: 0,
    overrideAccess: true,
    context: { [CONTEXTE_BRUT]: true },
  })
  return parametres.smtp
}

export const AUCUN_SMTP =
  'Aucun serveur d’e-mail configuré : renseignez-le dans Paramètres, onglet « E-mails (SMTP) », puis activez-le.'

// Adaptateur Payload : relit les réglages à chaque envoi, donc un changement dans Paramètres
// est pris en compte sans redémarrage.
export const adaptateurEmail: EmailAdapter = ({ payload }) => ({
  name: 'cbrs-smtp',
  defaultFromAddress: process.env.SMTP_FROM || DEFAUT_EXPEDITEUR,
  defaultFromName: 'CBRS',
  sendEmail: async (message) => {
    const config = choisirConfigEnvoi(await lireSmtp(payload), process.env)
    if (!config) {
      payload.logger.error(`E-mail non envoyé (« ${String(message.subject ?? '')} ») : ${AUCUN_SMTP}`)
      throw new Error(AUCUN_SMTP)
    }
    const fabrique = await nodemailerAdapter({
      defaultFromAddress: config.expediteur,
      defaultFromName: config.nomExpediteur,
      skipVerify: true,
      transportOptions: {
        host: config.hote,
        port: config.port,
        secure: config.securise,
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
        auth: config.utilisateur ? { user: config.utilisateur, pass: config.motDePasse ?? '' } : undefined,
      },
    })
    return fabrique({ payload }).sendEmail(message)
  },
})
