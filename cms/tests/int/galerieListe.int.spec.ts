import { describe, expect, it } from 'vitest'

import config from '@/payload.config'

describe('Liste de la galerie', () => {
  it('affiche 20 photos par page', async () => {
    const galerie = (await config).collections.find((collection) => collection.slug === 'galerie')

    expect(galerie?.admin.pagination?.defaultLimit).toBe(20)
    expect(galerie?.admin.pagination?.limits).toEqual([20, 50, 100])
  })

  // L'import s'ouvre depuis la barre des vues : un seul composant en tête de liste.
  it('place la barre des vues et de l’import en tête de liste', async () => {
    const galerie = (await config).collections.find((collection) => collection.slug === 'galerie')

    expect(galerie?.admin.components?.beforeListTable).toEqual(['/admin/GalerieVues#GalerieVues'])
  })
})
