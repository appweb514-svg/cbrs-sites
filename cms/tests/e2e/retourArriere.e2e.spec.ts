import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../../src/payload.config.js'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const SERVER = 'http://localhost:3000'
const DOSSIER_MEDIA = fileURLToPath(new URL('../../media', import.meta.url))
const DOSSIER_DOCUMENTS = fileURLToPath(new URL('../../documents', import.meta.url))

// PDF minimal valide : en-tête « %PDF- », table « xref » et « %%EOF » exigés par Payload.
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF\n',
)

let payload: Payload
let page: Page
let idMedia: number | string

type Fiche = {
  api: string
  avant: unknown
  edition: string
  lire: (donnees: Record<string, unknown>) => unknown
  nettoyer?: () => Promise<void>
}

// Chaque fiche est préparée avec deux versions (avant → après) ; le bouton doit restaurer « avant ».
const fiches: { nom: string; preparer: () => Promise<Fiche> }[] = [
  {
    nom: 'Vie du club',
    preparer: async () => {
      const doc = await payload.create({
        collection: 'vie-du-club',
        draft: false,
        data: {
          _status: 'published',
          categorie: 'club',
          date: '2026-09-01',
          resume: 'Résumé e2e',
          titre: 'Actu e2e',
        },
      })
      await payload.update({
        collection: 'vie-du-club',
        data: { titre: 'Actu e2e modifiée' },
        id: doc.id,
      })
      return {
        api: `/api/vie-du-club/${doc.id}`,
        avant: 'Actu e2e',
        edition: `/admin/collections/vie-du-club/${doc.id}`,
        lire: (donnees) => donnees.titre,
        nettoyer: async () => {
          await payload.delete({ collection: 'vie-du-club', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Présentation du bureau',
    preparer: async () => {
      const doc = await payload.create({
        collection: 'membres-bureau',
        data: { fonction: 'Président', nom: 'Membre e2e' },
      })
      await payload.update({
        collection: 'membres-bureau',
        data: { fonction: 'Trésorier' },
        id: doc.id,
      })
      return {
        api: `/api/membres-bureau/${doc.id}`,
        avant: 'Président',
        edition: `/admin/collections/membres-bureau/${doc.id}`,
        lire: (donnees) => donnees.fonction,
        nettoyer: async () => {
          await payload.delete({ collection: 'membres-bureau', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Activités',
    preparer: async () => {
      const doc = await payload.create({
        collection: 'activites',
        draft: false,
        data: {
          _status: 'published',
          description: 'Description e2e',
          nom: 'Activité e2e',
          slug: `activite-e2e-${Date.now()}`,
        },
      })
      await payload.update({
        collection: 'activites',
        data: { _status: 'published', nom: 'Activité e2e modifiée' },
        draft: false,
        id: doc.id,
      })
      return {
        api: `/api/activites/${doc.id}`,
        avant: 'Activité e2e',
        edition: `/admin/collections/activites/${doc.id}`,
        lire: (donnees) => donnees.nom,
        nettoyer: async () => {
          await payload.delete({ collection: 'activites', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Sorties & Voyages',
    preparer: async () => {
      const doc = await payload.create({
        collection: 'sorties',
        draft: false,
        data: {
          _status: 'published',
          date: '2026-10-01',
          lieu: 'Beauvais',
          resume: 'Résumé e2e',
          titre: 'Sortie e2e',
          type: 'sortie',
        },
      })
      await payload.update({
        collection: 'sorties',
        data: { _status: 'published', titre: 'Sortie e2e modifiée' },
        draft: false,
        id: doc.id,
      })
      return {
        api: `/api/sorties/${doc.id}`,
        avant: 'Sortie e2e',
        edition: `/admin/collections/sorties/${doc.id}`,
        lire: (donnees) => donnees.titre,
        nettoyer: async () => {
          await payload.delete({ collection: 'sorties', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Galerie',
    preparer: async () => {
      const doc = await payload.create({
        collection: 'galerie',
        data: { annee: 2026, categorie: 'vie', legende: 'Légende e2e', photo: idMedia as number },
      })
      await payload.update({
        collection: 'galerie',
        data: { legende: 'Légende e2e modifiée' },
        id: doc.id,
      })
      return {
        api: `/api/galerie/${doc.id}`,
        avant: 'Légende e2e',
        edition: `/admin/collections/galerie/${doc.id}`,
        lire: (donnees) => donnees.legende,
        nettoyer: async () => {
          await payload.delete({ collection: 'galerie', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Photos',
    preparer: async () => {
      const image = await imageE2e()
      const doc = await payload.create({
        collection: 'media',
        data: { alt: 'Photo e2e' },
        file: {
          data: image,
          mimetype: 'image/png',
          name: 'photo-retour-e2e.png',
          size: image.length,
        },
      })
      await payload.update({ collection: 'media', data: { alt: 'Photo e2e modifiée' }, id: doc.id })
      return {
        api: `/api/media/${doc.id}`,
        avant: 'Photo e2e',
        edition: `/admin/collections/media/${doc.id}`,
        lire: (donnees) => donnees.alt,
        nettoyer: async () => {
          await payload.delete({ collection: 'media', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Documents',
    preparer: async () => {
      const doc = await payload.create({
        collection: 'documents',
        data: { categorie: 'autre', remplaceLienOfficiel: 'aucun', titre: 'Document e2e' },
        file: {
          data: PDF,
          mimetype: 'application/pdf',
          name: 'document-retour-e2e.pdf',
          size: PDF.length,
        },
      })
      await payload.update({
        collection: 'documents',
        data: { titre: 'Document e2e modifié' },
        id: doc.id,
      })
      return {
        api: `/api/documents/${doc.id}`,
        avant: 'Document e2e',
        edition: `/admin/collections/documents/${doc.id}`,
        lire: (donnees) => donnees.titre,
        nettoyer: async () => {
          await payload.delete({ collection: 'documents', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Bénévoles',
    preparer: async () => {
      const jeton = Date.now()
      const doc = await payload.create({
        collection: 'users',
        data: {
          email: `benevole-${jeton}@cbrs.local`,
          nom: 'Bénévole e2e',
          password: 'motdepasse-e2e',
        },
      })
      await payload.update({
        collection: 'users',
        data: { nom: 'Bénévole e2e modifié' },
        id: doc.id,
      })
      return {
        api: `/api/users/${doc.id}`,
        avant: 'Bénévole e2e',
        edition: `/admin/collections/users/${doc.id}`,
        lire: (donnees) => donnees.nom,
        nettoyer: async () => {
          await payload.delete({ collection: 'users', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Rôles',
    preparer: async () => {
      const jeton = Date.now()
      const doc = await payload.create({ collection: 'roles', data: { nom: `Rôle e2e ${jeton}` } })
      await payload.update({
        collection: 'roles',
        data: { nom: `Rôle e2e modifié ${jeton}` },
        id: doc.id,
      })
      return {
        api: `/api/roles/${doc.id}`,
        avant: `Rôle e2e ${jeton}`,
        edition: `/admin/collections/roles/${doc.id}`,
        lire: (donnees) => donnees.nom,
        nettoyer: async () => {
          await payload.delete({ collection: 'roles', id: doc.id }).catch(() => undefined)
        },
      }
    },
  },
  {
    nom: 'Flash info',
    preparer: async () => {
      await payload.updateGlobal({ slug: 'flash-info', data: { message: 'Message e2e' } })
      await payload.updateGlobal({ slug: 'flash-info', data: { message: 'Message e2e modifié' } })
      return {
        api: '/api/globals/flash-info',
        avant: 'Message e2e',
        edition: '/admin/globals/flash-info',
        lire: (donnees) => donnees.message,
      }
    },
  },
  {
    nom: 'Tarifs',
    preparer: async () => {
      await payload.updateGlobal({
        data: { lignes: [{ libelle: 'Adulte e2e', montant: '49 €' }] },
        slug: 'tarifs',
      })
      await payload.updateGlobal({
        data: { lignes: [{ libelle: 'Adulte e2e modifié', montant: '49 €' }] },
        slug: 'tarifs',
      })
      return {
        api: '/api/globals/tarifs',
        avant: 'Adulte e2e',
        edition: '/admin/globals/tarifs',
        lire: (donnees) => (donnees.lignes as { libelle?: string }[] | undefined)?.[0]?.libelle,
      }
    },
  },
  {
    nom: 'Paramètres du site',
    preparer: async () => {
      await payload.updateGlobal({ data: { adherents: '1 200' }, slug: 'parametres' })
      await payload.updateGlobal({ data: { adherents: '1 201' }, slug: 'parametres' })
      return {
        api: '/api/globals/parametres',
        avant: '1 200',
        edition: '/admin/globals/parametres',
        lire: (donnees) => donnees.adherents,
      }
    },
  },
  {
    nom: 'Apparence du site',
    preparer: async () => {
      await payload.updateGlobal({ data: { policeTitres: 'defaut' }, slug: 'apparence' })
      await payload.updateGlobal({ data: { policeTitres: 'Inter' }, slug: 'apparence' })
      return {
        api: '/api/globals/apparence',
        avant: 'defaut',
        edition: '/admin/globals/apparence',
        lire: (donnees) => donnees.policeTitres,
      }
    },
  },
  {
    nom: 'Page Formation',
    preparer: async () => {
      await payload.updateGlobal({ data: { parcoursTitre: 'Formation e2e' }, slug: 'formation' })
      await payload.updateGlobal({ data: { parcoursTitre: 'Formation e2e modifiée' }, slug: 'formation' })
      return {
        api: '/api/globals/formation',
        avant: 'Formation e2e',
        edition: '/admin/globals/formation',
        lire: (donnees) => donnees.parcoursTitre,
      }
    },
  },
]

const imageE2e = async (): Promise<Buffer> =>
  sharp({ create: { background: { b: 40, g: 90, r: 200 }, channels: 3, height: 600, width: 800 } })
    .png()
    .toBuffer()

// Le test et le serveur de développement écrivent le même fichier SQLite : on réessaie les
// écritures qui tombent pendant un verrou (SQLITE_BUSY), sans masquer les autres erreurs.
const reessayer = async <T>(action: () => Promise<T>, essais = 6): Promise<T> => {
  for (let essai = 1; ; essai++) {
    try {
      return await action()
    } catch (erreur) {
      const details = `${String(erreur)} ${String((erreur as { cause?: unknown })?.cause ?? '')}`
      if (essai >= essais || !/locked|SQLITE_BUSY/i.test(details)) throw erreur
      await new Promise((resoudre) => setTimeout(resoudre, 200 * essai))
    }
  }
}

const avecReessai = (client: Payload): Payload =>
  new Proxy(client, {
    get(cible, cle) {
      const valeur = Reflect.get(cible, cle) as unknown
      if (typeof valeur !== 'function') return valeur
      return (...args: unknown[]) =>
        reessayer(() => (valeur as (...a: unknown[]) => Promise<unknown>).apply(cible, args))
    },
  }) as Payload

test.describe('Retour en arrière', () => {
  test.beforeAll(async ({ browser }) => {
    payload = avecReessai(await getPayload({ config }))
    await reessayer(seedTestUser)

    const image = await imageE2e()
    const photo = await payload.create({
      collection: 'media',
      data: { alt: 'Photo support e2e' },
      file: {
        data: image,
        mimetype: 'image/png',
        name: 'photo-support-e2e.png',
        size: image.length,
      },
    })
    idMedia = photo.id

    const contexte = await browser.newContext()
    page = await contexte.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    if (payload) await payload.delete({ collection: 'media', id: idMedia }).catch(() => undefined)
    await reessayer(cleanupTestUser)
    for (const [dossier, prefixe] of [
      [DOSSIER_MEDIA, 'photo-'],
      [DOSSIER_DOCUMENTS, 'document-'],
    ] as const) {
      const restants = await fs.readdir(dossier).catch(() => [] as string[])
      await Promise.all(
        restants
          .filter((fichier) => fichier.startsWith(prefixe) && fichier.includes('e2e'))
          .map((fichier) => fs.rm(`${dossier}/${fichier}`, { force: true })),
      )
    }
  })

  for (const { nom, preparer } of fiches) {
    test(`« ${nom} » : le bouton restaure la version précédente`, async () => {
      const fiche = await preparer()
      try {
        await page.goto(`${SERVER}${fiche.edition}`)

        const bouton = page.getByRole('button', { name: 'Revenir en arrière' })
        await expect(bouton).toBeVisible()
        await expect(bouton).toHaveAttribute(
          'title',
          /^Revenir à la version du \d{2}\/\d{2}\/\d{4}/,
        )

        // Le rechargement de la fiche efface ce repère.
        await page.evaluate('window.__avantRetour = true')
        page.once('dialog', (dialogue) => dialogue.accept())
        await bouton.click()
        await page.waitForFunction('window.__avantRetour === undefined', undefined, {
          timeout: 30000,
        })

        await expect
          .poll(
            async () => {
              const reponse = await page.request.get(`${SERVER}${fiche.api}`)
              return fiche.lire((await reponse.json()) as Record<string, unknown>)
            },
            { timeout: 20000 },
          )
          .toBe(fiche.avant)
      } finally {
        await fiche.nettoyer?.()
      }
    })
  }

  // Régression : restaurer un brouillon comme version publiée retirait la fiche du site.
  test('« Vie du club » : revenir sur un brouillon garde la fiche en ligne', async () => {
    const publie = { categorie: 'club' as const, date: '2026-09-01', resume: 'Résumé e2e' }
    const doc = await payload.create({
      collection: 'vie-du-club',
      data: { ...publie, _status: 'published', titre: 'Publiée e2e A' },
      draft: false,
    })
    try {
      await payload.update({
        collection: 'vie-du-club',
        data: { _status: 'draft', titre: 'Brouillon e2e B' },
        draft: true,
        id: doc.id,
      })
      await payload.update({
        collection: 'vie-du-club',
        data: { _status: 'published', titre: 'Publiée e2e C' },
        draft: false,
        id: doc.id,
      })
      await page.goto(`${SERVER}/admin/collections/vie-du-club/${doc.id}`)

      await page.evaluate('window.__avantRetour = true')
      page.once('dialog', (dialogue) => dialogue.accept())
      await page.getByRole('button', { name: 'Revenir en arrière' }).click()
      await page.waitForFunction('window.__avantRetour === undefined', undefined, {
        timeout: 30000,
      })

      const enLigne = await (await page.request.get(`${SERVER}/api/vie-du-club/${doc.id}`)).json()
      expect(enLigne._status).toBe('published')
      expect(enLigne.titre).toBe('Publiée e2e C')
      const brouillon = await (
        await page.request.get(`${SERVER}/api/vie-du-club/${doc.id}?draft=true`)
      ).json()
      expect(brouillon.titre).toBe('Brouillon e2e B')
    } finally {
      await payload.delete({ collection: 'vie-du-club', id: doc.id }).catch(() => undefined)
    }
  })
})
