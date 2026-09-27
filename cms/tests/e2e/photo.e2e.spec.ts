import { expect, test, type Locator, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../../src/payload.config.js'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const SERVER = 'http://localhost:3000'
const DOSSIER_MEDIA = fileURLToPath(new URL('../../media', import.meta.url))

let payload: Payload
let page: Page
let idPhoto: number | string

const apercuPhoto = (cible: Page) => cible.locator('.file-details__thumbnail img')

const largeurNaturelle = (image: Locator) =>
  image.evaluate((element) => (element as HTMLImageElement).naturalWidth)

// Le renommage recharge la fiche : le repère posé dans la page disparaît avec elle.
const poserRepere = (cible: Page) => cible.evaluate('window.__cbrsAvantRechargement = true')
const attendreRechargement = (cible: Page) =>
  cible.waitForFunction('window.__cbrsAvantRechargement === undefined')

test.describe('Fiche photo', () => {
  test.beforeAll(async ({ browser }) => {
    payload = await getPayload({ config })
    await seedTestUser()

    const image = await sharp({
      create: { background: { b: 40, g: 90, r: 200 }, channels: 3, height: 600, width: 800 },
    })
      .png()
      .toBuffer()
    const photo = await payload.create({
      collection: 'media',
      data: { alt: 'Photo e2e' },
      file: { data: image, mimetype: 'image/png', name: 'photo-e2e.png', size: image.length },
    })
    idPhoto = photo.id

    const contexte = await browser.newContext()
    page = await contexte.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    if (payload) await payload.delete({ collection: 'media', id: idPhoto }).catch(() => undefined)
    await cleanupTestUser()
    const restants = await fs.readdir(DOSSIER_MEDIA).catch(() => [] as string[])
    await Promise.all(
      restants
        .filter((fichier) => fichier.startsWith('photo-e2e'))
        .map((fichier) => fs.rm(path.join(DOSSIER_MEDIA, fichier), { force: true })),
    )
  })

  test('une photo renommée reste affichée et enregistrée', async () => {
    await page.goto(`${SERVER}/admin/collections/media/${idPhoto}`)
    await expect(page.locator('#renommer-fichier')).toBeVisible()
    await expect(apercuPhoto(page)).toBeVisible()
    await expect.poll(() => largeurNaturelle(apercuPhoto(page))).toBeGreaterThan(0)

    await page.fill('#renommer-fichier', 'photo-e2e-renommee')
    await poserRepere(page)
    await page.getByRole('button', { name: 'Renommer', exact: true }).click()
    await attendreRechargement(page)

    const apercu = apercuPhoto(page)
    await expect(apercu).toBeVisible()
    await expect(apercu).toHaveAttribute('src', /photo-e2e-renommee/)
    await expect.poll(() => largeurNaturelle(apercu)).toBeGreaterThan(0)

    // Payload n'active « Sauvegarder » que si le formulaire a changé : on décrit la photo.
    await page.fill('#field-alt', 'Photo e2e renommée')
    await Promise.all([
      page.waitForResponse(
        (reponse) =>
          reponse.url().startsWith(`${SERVER}/api/media/`) &&
          reponse.request().method() === 'PATCH',
      ),
      page.locator('#action-save').click(),
    ])
    await page.reload()

    await expect(apercu).toBeVisible()
    await expect(apercu).toHaveAttribute('src', /photo-e2e-renommee/)
    await expect.poll(() => largeurNaturelle(apercu)).toBeGreaterThan(0)

    const reponse = await page.request.get(`${SERVER}/api/media/${idPhoto}`)
    expect(reponse.status()).toBe(200)
    const donnees = (await reponse.json()) as { filename?: string; url?: string }
    expect(donnees.filename).toBe('photo-e2e-renommee.png')
    const fichier = await page.request.get(new URL(String(donnees.url), SERVER).href)
    expect(fichier.status()).toBe(200)
  })

  test('« Modifier l’image » ouvre notre éditeur à cinq onglets', async () => {
    await page.goto(`${SERVER}/admin/collections/media/${idPhoto}`)

    await expect(page.locator('.file-field__edit')).toBeHidden()
    const boutons = page.getByRole('button', { name: /Modifier l['’]image/ })
    await expect(boutons).toHaveCount(1)
    await boutons.click()

    const fenetre = page.locator('[role="dialog"][aria-label*="Modification de l’image"]')
    await expect(fenetre).toBeVisible()
    for (const onglet of ['Recadrer', /Point d['’]intérêt/, 'Filtres', 'Texte', 'Contours']) {
      await expect(fenetre.getByRole('button', { name: onglet })).toBeVisible()
    }
    // La fenêtre s'ouvre sur « Recadrer ».
    await expect(fenetre.getByRole('button', { name: 'Recadrer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const avant = (await (await page.request.get(`${SERVER}/api/media/${idPhoto}`)).json()) as {
      updatedAt: string
    }

    await fenetre.getByRole('button', { name: /Point d['’]intérêt/ }).click()
    const toile = fenetre.locator('canvas')
    await expect(toile).toBeVisible()
    const boite = await toile.boundingBox()
    if (!boite) throw new Error('Aperçu de l’éditeur introuvable.')
    // Le calque du point d'intérêt, posé sur l'aperçu, reçoit le clic.
    await page.mouse.click(boite.x + boite.width * 0.25, boite.y + boite.height * 0.3)

    const repere = fenetre.locator('div[aria-hidden="true"]')
    await expect(repere).toBeVisible()
    const boiteRepere = await repere.boundingBox()
    if (!boiteRepere) throw new Error('Repère du point d’intérêt introuvable.')
    expect(boiteRepere.x).toBeLessThan(boite.x + boite.width / 2)
    expect(boiteRepere.y).toBeLessThan(boite.y + boite.height / 2)
    await expect(fenetre.getByText(/^Position : /)).toHaveText(/2[0-9] % \/ 3[0-9] %/)

    await fenetre.getByRole('button', { name: 'Annuler' }).click()
    await expect(fenetre).toBeHidden()

    const apres = (await (await page.request.get(`${SERVER}/api/media/${idPhoto}`)).json()) as {
      updatedAt: string
    }
    expect(apres.updatedAt).toBe(avant.updatedAt)
  })
})
