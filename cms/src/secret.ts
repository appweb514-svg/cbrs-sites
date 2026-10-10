import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

// Chiffrement des secrets enregistrés dans le CMS (mot de passe SMTP, clés de stockage externe).
// AES-256-GCM, clé dérivée de PAYLOAD_SECRET : changer PAYLOAD_SECRET rend les secrets illisibles.
const PREFIXE = 'enc:'

// Valeur renvoyée à l’interface à la place d’un secret enregistré.
export const MASQUE = '••••••••'

let cleEnCache: { secret: string; cle: Buffer } | undefined

const cle = (): Buffer => {
  const secret = process.env.PAYLOAD_SECRET || ''
  if (!secret) throw new Error('PAYLOAD_SECRET est absent : impossible de chiffrer les secrets.')
  if (cleEnCache?.secret !== secret) cleEnCache = { secret, cle: scryptSync(secret, 'cbrs-secret-v1', 32) }
  return cleEnCache.cle
}

export const estChiffre = (valeur: unknown): valeur is string => typeof valeur === 'string' && valeur.startsWith(PREFIXE)

// Une valeur déjà chiffrée n’est pas rechiffrée.
export const chiffrer = (clair: string): string => {
  if (estChiffre(clair)) return clair
  const iv = randomBytes(12)
  const chiffreur = createCipheriv('aes-256-gcm', cle(), iv)
  const donnees = Buffer.concat([chiffreur.update(clair, 'utf8'), chiffreur.final()])
  return PREFIXE + Buffer.concat([iv, chiffreur.getAuthTag(), donnees]).toString('base64')
}

// Une valeur sans préfixe est renvoyée telle quelle (secret saisi avant le chiffrement).
export const dechiffrer = (valeur: string): string => {
  if (!estChiffre(valeur)) return valeur
  try {
    const brut = Buffer.from(valeur.slice(PREFIXE.length), 'base64')
    const dechiffreur = createDecipheriv('aes-256-gcm', cle(), brut.subarray(0, 12))
    dechiffreur.setAuthTag(brut.subarray(12, 28))
    return Buffer.concat([dechiffreur.update(brut.subarray(28)), dechiffreur.final()]).toString('utf8')
  } catch {
    throw new Error('Secret illisible : PAYLOAD_SECRET a changé depuis son enregistrement. Saisissez-le à nouveau.')
  }
}
