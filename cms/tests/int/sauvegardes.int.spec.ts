import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { choisirConfigEnvoi } from '@/email'
import { sauvegardeEtat, sauvegardeLancer, sauvegardeTelecharger, sauvegardeTestExterne } from '@/endpoints/sauvegardes'
import { smtpTest } from '@/endpoints/smtpTest'
import { CONTEXTE_BRUT } from '@/fields/champSecret'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { envPostgres } from '@/sauvegarde/base'
import { aPurger, nomInstantane } from '@/sauvegarde/purge'
import { derniereEcheance, sauvegardeDue } from '@/sauvegarde/planification'
import { dossierDistant, envRclone, racineDistante } from '@/sauvegarde/rclone'
import { MASQUE, chiffrer } from '@/secret'

let payload: Payload
let admin: User
let membre: User

const creer = async (email: string, estAdministrateur: boolean) => {
  const user = await payload.create({
    collection: 'users',
    data: { email, nom: email, password: 'motdepasse-test', estAdministrateur },
  })
  return payload.findByID({ collection: 'users', id: user.id, depth: 1 })
}
const pour = (user: User) => ({ user: { ...user, collection: 'users' as const }, overrideAccess: false })
const brut = () =>
  payload.findGlobal({ slug: 'parametres', depth: 0, overrideAccess: true, context: { [CONTEXTE_BRUT]: true } })

beforeAll(async () => {
  payload = await getPayload({ config })
  admin = await creer('smtp-admin@test.local', true)
  membre = await creer('smtp-membre@test.local', false)
})

describe('Paramètres : SMTP et sauvegardes réservés à l’administrateur', () => {
  it('l’admin enregistre, le mot de passe est chiffré et jamais renvoyé en clair', async () => {
    const maj = await payload.updateGlobal({
      slug: 'parametres',
      data: {
        smtp: { actif: true, hote: 'smtp.test.local', port: 465, securise: true, utilisateur: 'u', motDePasse: 'Pa$$w0rd-secret' },
        sauvegarde: { externe: { fournisseur: 's3', bucket: 'b', cleAcces: 'AK', cleSecrete: 'SK-secret' } },
      },
      ...pour(admin),
    })
    expect(maj.smtp?.motDePasse).toBe(MASQUE)
    expect(JSON.stringify(maj)).not.toContain('Pa$$w0rd-secret')

    const lu = await payload.findGlobal({ slug: 'parametres', ...pour(admin) })
    expect(lu.smtp?.motDePasse).toBe(MASQUE)
    expect(lu.sauvegarde?.externe?.cleSecrete).toBe(MASQUE)

    const interne = await brut()
    expect(interne.smtp?.motDePasse?.startsWith('enc:')).toBe(true)
    expect(interne.sauvegarde?.externe?.cleSecrete?.startsWith('enc:')).toBe(true)
  })

  it('laisser le mot de passe vide ou masqué conserve l’ancien', async () => {
    const avant = (await brut()).smtp?.motDePasse
    await payload.updateGlobal({ slug: 'parametres', data: { smtp: { hote: 'autre.test.local', motDePasse: '' } }, ...pour(admin) })
    await payload.updateGlobal({ slug: 'parametres', data: { smtp: { motDePasse: MASQUE } }, ...pour(admin) })
    const apres = await brut()
    expect(apres.smtp?.hote).toBe('autre.test.local')
    expect(apres.smtp?.motDePasse).toBe(avant)
  })

  it('un membre non admin et un anonyme ne lisent ni smtp ni sauvegarde', async () => {
    for (const options of [pour(membre), { overrideAccess: false }]) {
      const lu = await payload.findGlobal({ slug: 'parametres', ...options })
      expect(lu).not.toHaveProperty('smtp')
      expect(lu).not.toHaveProperty('sauvegarde')
      expect(lu.emailContact).toBeTruthy()
    }
  })

  it('un non-admin ne peut pas modifier les Paramètres', async () => {
    await expect(
      payload.updateGlobal({ slug: 'parametres', data: { smtp: { hote: 'pirate' } }, ...pour(membre) }),
    ).rejects.toThrow()
  })
})

describe('Endpoints sauvegardes et SMTP', () => {
  const appeler = (endpoint: { handler: unknown }, user: User | null) =>
    (endpoint.handler as (req: PayloadRequest) => Promise<Response>)({
      headers: new Headers(),
      payload,
      user: user && { ...user, collection: 'users' },
    } as unknown as PayloadRequest)
  const endpoints = [sauvegardeTelecharger, sauvegardeLancer, sauvegardeEtat, sauvegardeTestExterne, smtpTest]

  it('401 sans connexion', async () => {
    for (const endpoint of endpoints) expect((await appeler(endpoint, null)).status).toBe(401)
  })

  it('403 pour un utilisateur non admin', async () => {
    for (const endpoint of endpoints) expect((await appeler(endpoint, membre)).status).toBe(403)
  })

  it('409 sur Vercel (sauvegardes), l’e-mail de test reste actif', async () => {
    process.env.VERCEL = '1'
    try {
      for (const endpoint of [sauvegardeTelecharger, sauvegardeLancer, sauvegardeEtat, sauvegardeTestExterne]) {
        expect((await appeler(endpoint, admin)).status).toBe(409)
      }
    } finally {
      delete process.env.VERCEL
    }
  })

  it('les chemins sont déclarés', () => {
    const chemins = (payload.config.endpoints ?? []).map((e) => (typeof e === 'string' ? e : e.path))
    expect(chemins).toEqual(
      expect.arrayContaining(['/parametres-smtp-test', '/sauvegardes/telecharger', '/sauvegardes/lancer', '/sauvegardes/etat', '/sauvegardes/test-externe']),
    )
  })
})

describe('Choix de la configuration d’envoi', () => {
  it('réglages du CMS s’ils sont actifs, sinon variables SMTP_*, sinon rien', () => {
    const cms = choisirConfigEnvoi({ actif: true, hote: 'h', port: 465, securise: true, motDePasse: chiffrer('pw'), utilisateur: 'u' }, {})
    expect(cms).toMatchObject({ source: 'cms', hote: 'h', port: 465, securise: true, motDePasse: 'pw', nomExpediteur: 'CBRS' })
    expect(choisirConfigEnvoi({ actif: false, hote: 'h' }, { SMTP_HOST: 'env.local' })).toMatchObject({ source: 'env', hote: 'env.local', port: 587 })
    expect(choisirConfigEnvoi({ actif: true, hote: '' }, {})).toBeNull()
  })
})

describe('Environnement rclone', () => {
  const secrets = ['SECRET-S3', 'JETON-DROPBOX']

  it('S3 : variables de la destination, aucun secret en argument', () => {
    const externe = { fournisseur: 's3', endpoint: 'https://s3.gra.test', region: 'gra', bucket: 'bk', cleAcces: 'AK', cleSecrete: chiffrer('SECRET-S3'), dossier: '/x/../sauv/' }
    const env = envRclone(externe, { PATH: '/usr/bin', HOME: '/h', DATABASE_URL: 'postgres://u:p@h/d' })
    expect(env).toMatchObject({
      RCLONE_CONFIG_CBRS_TYPE: 's3',
      RCLONE_CONFIG_CBRS_PROVIDER: 'Other',
      RCLONE_CONFIG_CBRS_ACCESS_KEY_ID: 'AK',
      RCLONE_CONFIG_CBRS_SECRET_ACCESS_KEY: 'SECRET-S3',
      RCLONE_CONFIG_CBRS_ENDPOINT: 'https://s3.gra.test',
      RCLONE_CONFIG_CBRS_REGION: 'gra',
    })
    expect(env.DATABASE_URL).toBeUndefined()
    expect(racineDistante(externe)).toBe('cbrs:bk/x/sauv')
    expect(racineDistante(externe)).not.toContain(secrets[0])
  })

  it('Dropbox et Drive : jeton et portée', () => {
    const jeton = chiffrer('{"access_token":"JETON-DROPBOX"}')
    const dropbox = envRclone({ fournisseur: 'dropbox', jeton, dossier: 'cbrs' }, {})
    expect(dropbox).toMatchObject({ RCLONE_CONFIG_CBRS_TYPE: 'dropbox', RCLONE_CONFIG_CBRS_TOKEN: '{"access_token":"JETON-DROPBOX"}' })
    expect(envRclone({ fournisseur: 'drive', jeton }, {})).toMatchObject({ RCLONE_CONFIG_CBRS_TYPE: 'drive', RCLONE_CONFIG_CBRS_SCOPE: 'drive' })
    expect(racineDistante({ fournisseur: 'dropbox', dossier: 'cbrs' })).toBe('cbrs:cbrs')
    expect(dossierDistant('')).toBe('cbrs-sauvegardes')
  })
})

describe('Base de données et planification', () => {
  it('pg_dump reçoit le mot de passe par l’environnement', () => {
    expect(envPostgres('postgresql://moi:p%40ss@db.local:5433/cbrs?sslmode=require', { PATH: '/usr/bin' })).toMatchObject({
      PGHOST: 'db.local',
      PGPORT: '5433',
      PGDATABASE: 'cbrs',
      PGUSER: 'moi',
      PGPASSWORD: 'p@ss',
      PGSSLMODE: 'require',
    })
  })

  it('purge : supprime les instantanés au-delà de la durée, garde le plus récent', () => {
    const noms = ['2026-06-01_0300', '2026-07-05_0300', '2026-09-20_0300', '2026-10-04_0300', 'etat.json', 'n-importe-quoi']
    expect(aPurger(noms, new Date(2026, 9, 10), 100)).toEqual(['2026-06-01_0300'])
    expect(aPurger(noms, new Date(2026, 9, 10), 90)).toEqual(['2026-06-01_0300', '2026-07-05_0300'])
    expect(aPurger(noms, new Date(2026, 9, 10), 15)).toEqual(['2026-06-01_0300', '2026-07-05_0300', '2026-09-20_0300'])
    // Rien de récent : on garde quand même le dernier.
    expect(aPurger(['2020-01-01_0300', '2020-01-08_0300'], new Date(2026, 9, 10), 90)).toEqual(['2020-01-01_0300'])
    expect(aPurger(['2020-01-01_0300'], new Date(2026, 9, 10), 90)).toEqual([])
    // Dossiers distants (rclone lsf) : date en tête de nom, barre finale ou extension acceptées.
    expect(aPurger(['2026-01-01_0300/', '2026-10-04_0300/'], new Date(2026, 9, 10), 90)).toEqual(['2026-01-01_0300/'])
    expect(nomInstantane(new Date(2026, 0, 5, 3, 7))).toBe('2026-01-05_0307')
  })

  it('une sauvegarde est due une fois par semaine, à l’échéance choisie', () => {
    // Samedi 10 octobre 2026 : dernière échéance « dimanche 3 h » = dimanche 4 octobre.
    const maintenant = new Date(2026, 9, 10, 12, 0)
    expect(derniereEcheance(maintenant, 0, 3)).toEqual(new Date(2026, 9, 4, 3, 0))
    expect(sauvegardeDue({ maintenant, derniereTentative: new Date(2026, 9, 3, 3, 0), jour: 0, heure: 3 })).toBe(true)
    expect(sauvegardeDue({ maintenant, derniereTentative: new Date(2026, 9, 4, 3, 1), jour: 0, heure: 3 })).toBe(false)
    // Le jour même, avant l’heure : l’échéance de la semaine précédente compte.
    expect(derniereEcheance(new Date(2026, 9, 11, 2, 0), 0, 3)).toEqual(new Date(2026, 9, 4, 3, 0))
    expect(derniereEcheance(new Date(2026, 9, 11, 3, 0), 0, 3)).toEqual(new Date(2026, 9, 11, 3, 0))
  })
})
