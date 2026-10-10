import { dechiffrer } from '../secret'
import { executer, type Env } from './executer'

export type Externe = {
  fournisseur?: string | null
  endpoint?: string | null
  region?: string | null
  bucket?: string | null
  cleAcces?: string | null
  cleSecrete?: string | null
  jeton?: string | null
  dossier?: string | null
}

export const EXTERNE_ACTIF = (externe: Externe | null | undefined): externe is Externe =>
  externe?.fournisseur === 's3' || externe?.fournisseur === 'dropbox' || externe?.fournisseur === 'drive'

// Dossier distant nettoyé : segments simples, sans « .. », sans barre oblique en tête ou en queue.
export const dossierDistant = (dossier: string | null | undefined): string =>
  (dossier ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/') || 'cbrs-sauvegardes'

// Racine distante : pour S3 le premier élément du chemin est le bucket.
export const racineDistante = (externe: Externe): string => {
  const dossier = dossierDistant(externe.dossier)
  return externe.fournisseur === 's3' ? `cbrs:${(externe.bucket ?? '').trim()}/${dossier}` : `cbrs:${dossier}`
}

// Configuration de la destination « cbrs » par variables d’environnement du processus rclone :
// aucun fichier de configuration, aucun secret en argument de ligne de commande.
export const envRclone = (externe: Externe, base: Env = process.env): Env => {
  const env: Env = {
    PATH: base.PATH,
    HOME: base.HOME,
    LANG: base.LANG,
    TMPDIR: base.TMPDIR,
    RCLONE_CONFIG: '/dev/null',
  }
  const secret = (valeur: string | null | undefined) => (valeur ? dechiffrer(valeur) : '')
  if (externe.fournisseur === 's3') {
    const endpoint = externe.endpoint?.trim()
    env.RCLONE_CONFIG_CBRS_TYPE = 's3'
    env.RCLONE_CONFIG_CBRS_PROVIDER = endpoint ? 'Other' : 'AWS'
    env.RCLONE_CONFIG_CBRS_ENV_AUTH = 'false'
    env.RCLONE_CONFIG_CBRS_ACCESS_KEY_ID = externe.cleAcces?.trim() ?? ''
    env.RCLONE_CONFIG_CBRS_SECRET_ACCESS_KEY = secret(externe.cleSecrete)
    if (endpoint) env.RCLONE_CONFIG_CBRS_ENDPOINT = endpoint
    if (externe.region?.trim()) env.RCLONE_CONFIG_CBRS_REGION = externe.region.trim()
  } else if (externe.fournisseur === 'dropbox') {
    env.RCLONE_CONFIG_CBRS_TYPE = 'dropbox'
    env.RCLONE_CONFIG_CBRS_TOKEN = secret(externe.jeton)
  } else if (externe.fournisseur === 'drive') {
    env.RCLONE_CONFIG_CBRS_TYPE = 'drive'
    env.RCLONE_CONFIG_CBRS_SCOPE = 'drive'
    env.RCLONE_CONFIG_CBRS_TOKEN = secret(externe.jeton)
  }
  return env
}

const OPTIONS = ['--contimeout', '30s', '--low-level-retries', '3']

export const rclone = (externe: Externe, args: string[], options: { sortie?: boolean } = {}) =>
  executer('rclone', [...args, ...OPTIONS], { env: envRclone(externe), sortie: options.sortie })

export const verifierExterne = (externe: Externe): string | null => {
  if (!EXTERNE_ACTIF(externe)) return 'Aucune destination externe choisie.'
  if (externe.fournisseur === 's3') {
    if (!externe.bucket?.trim()) return 'Renseignez le nom du bucket.'
    if (!externe.cleAcces?.trim() || !externe.cleSecrete) return 'Renseignez la clé d’accès et la clé secrète.'
  } else if (!externe.jeton) {
    return 'Renseignez le jeton (voir les instructions sous le champ).'
  }
  return null
}
