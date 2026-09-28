import { expect, test, type Page } from '@playwright/test'

import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

const SERVER = 'http://localhost:3000'

let payload: Payload
let page: Page
let idMembre: number | string

test.describe('Retour en arrière', () => {
  test.beforeAll(async ({ browser }) => {
    payload = await getPayload({ config })
    await seedTestUser()

    const membre = await payload.create({
      collection: 'membres-bureau',
      data: { fonction: 'Président', nom: 'Membre e2e' },
    })
    await payload.update({
      collection: 'membres-bureau',
      data: { fonction: 'Trésorier' },
      id: membre.id,
    })
    idMembre = membre.id

    const contexte = await browser.newContext()
    page = await contexte.newPage()
    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    if (payload) {
      await payload.delete({ collection: 'membres-bureau', id: idMembre }).catch(() => undefined)
    }
    await cleanupTestUser()
  })

  test('le bouton à côté d’Enregistrer restaure la version précédente', async () => {
    await page.goto(`${SERVER}/admin/collections/membres-bureau/${idMembre}`)
    await expect(page.locator('#field-fonction')).toHaveValue('Trésorier')

    // Le bouton est porté dans la barre des actions d'enregistrement, avec le bouton natif.
    const bouton = page.getByRole('button', { name: 'Revenir en arrière' })
    await expect(bouton).toBeVisible()
    await expect(bouton).toHaveAttribute('title', /^Revenir à la version du \d{2}\/\d{2}\/\d{4}/)

    page.once('dialog', (dialogue) => dialogue.accept())
    await bouton.click()

    // La fiche est rechargée sur la version précédente.
    await expect(page.locator('#field-fonction')).toHaveValue('Président', { timeout: 20000 })
  })
})
