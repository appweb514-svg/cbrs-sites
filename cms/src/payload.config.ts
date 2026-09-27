import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Activites } from './collections/Activites'
import { Documents } from './collections/Documents'
import { Galerie } from './collections/Galerie'
import { Media } from './collections/Media'
import { MembresBureau } from './collections/MembresBureau'
import { Sorties } from './collections/Sorties'
import { Users } from './collections/Users'
import { VieDuClub } from './collections/VieDuClub'
import { FlashInfo } from './globals/FlashInfo'
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

// Envoi des e-mails (mot de passe oublié) uniquement si un serveur SMTP est configuré.
const smtpHost = process.env.SMTP_HOST

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
  },
  collections: [VieDuClub, MembresBureau, Activites, Sorties, Galerie, Documents, Media, Users],
  globals: [FlashInfo, Tarifs, Parametres],
  cors: siteOrigins,
  editor: lexicalEditor(),
  email: smtpHost
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'no-reply@cbrs60.fr',
        defaultFromName: 'CBRS',
        transportOptions: {
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 587),
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
            : undefined,
        },
      })
    : undefined,
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
  plugins: blobToken
    ? [
        vercelBlobStorage({
          collections: { media: true, documents: true },
          token: blobToken,
        }),
      ]
    : [],
})
