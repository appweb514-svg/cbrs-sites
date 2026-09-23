import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Activites } from './collections/Activites'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { MembresBureau } from './collections/MembresBureau'
import { Users } from './collections/Users'
import { VieDuClub } from './collections/VieDuClub'
import { FlashInfo } from './globals/FlashInfo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteOrigins = (process.env.CBRS_SITE_ORIGINS || 'http://127.0.0.1:8080,http://localhost:8080')
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
  },
  collections: [VieDuClub, MembresBureau, Activites, Documents, Media, Users],
  globals: [FlashInfo],
  cors: siteOrigins,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
