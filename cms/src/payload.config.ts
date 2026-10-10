import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { avecCasesVX } from './casesVX'
import { avecRetourArriere } from './retourArriere'
import { Activites } from './collections/Activites'
import { Documents } from './collections/Documents'
import { Galerie } from './collections/Galerie'
import { Media } from './collections/Media'
import { Roles } from './collections/Roles'
import { MembresBureau } from './collections/MembresBureau'
import { Sorties } from './collections/Sorties'
import { Users } from './collections/Users'
import { VieDuClub } from './collections/VieDuClub'
import { adaptateurEmail } from './email'
import { galerieLot } from './endpoints/galerieLot'
import { mediaRenommer } from './endpoints/mediaRenommer'
import {
  sauvegardeEtat,
  sauvegardeLancer,
  sauvegardeTelecharger,
  sauvegardeTestExterne,
} from './endpoints/sauvegardes'
import { smtpTest } from './endpoints/smtpTest'
import { demarrerPlanification } from './sauvegarde/planification'
import { Apparence } from './globals/Apparence'
import { FlashInfo } from './globals/FlashInfo'
import { Formation } from './globals/Formation'
import { Titres } from './globals/Titres'
import { Parametres } from './globals/Parametres'
import { Tarifs } from './globals/Tarifs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// PostgreSQL dès que l'URL commence par postgres:// ou postgresql://, SQLite sinon.
// POSTGRES_URL est l'alias fourni par l'intégration Neon de Vercel.
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const isPostgres = /^postgres(ql)?:\/\//.test(databaseUrl)

// Stockage Vercel Blob en production Vercel ; stockage disque (Docker, local) sans le jeton.
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

const siteOrigins = (
  process.env.CBRS_SITE_ORIGINS ||
  'https://cbrs-sites.vercel.app,http://127.0.0.1:8092,http://127.0.0.1:8090'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — CBRS administration',
    },
    dateFormat: 'dd/MM/yyyy HH:mm',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
    // Libellé français par défaut de Payload trop lourd : « Créer un(e) nouveau ou nouvelle ».
    translations: { fr: { general: { createNew: 'Ajouter', createNewLabel: 'Ajouter : {{label}}' } } },
  },
  endpoints: [
    galerieLot,
    mediaRenommer,
    smtpTest,
    sauvegardeTelecharger,
    sauvegardeLancer,
    sauvegardeEtat,
    sauvegardeTestExterne,
  ],
  collections: avecRetourArriere(
    avecCasesVX([
      VieDuClub,
      MembresBureau,
      Activites,
      Sorties,
      Galerie,
      Documents,
      Media,
      Users,
      Roles,
    ]),
    'collections',
  ),
  globals: avecRetourArriere([FlashInfo, Formation, Titres, Tarifs, Parametres, Apparence], 'globals'),
  cors: siteOrigins,
  editor: lexicalEditor(),
  // Réglages relus à chaque envoi : Paramètres (onglet E-mails) sinon variables SMTP_*.
  email: adaptateurEmail,
  // Sauvegarde hebdomadaire : seulement avec CBRS_SAUVEGARDES=1 (voir sauvegarde/planification.ts).
  onInit: (payload) => demarrerPlanification(payload),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: isPostgres
    ? postgresAdapter({ pool: { connectionString: databaseUrl } })
    : sqliteAdapter({
        client: {
          url: databaseUrl,
        },
      }),
  sharp,
  plugins: [
    vercelBlobStorage({
      alwaysInsertFields: true,
      collections: { media: true, documents: true },
      token: blobToken,
    }),
  ],
})
