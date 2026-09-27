import { describe, expect, it } from 'vitest'

import { assainirNom, formatPoids, nomAffiche, separerNom } from '@/nomFichier'

describe('Noms de fichier', () => {
  it('sépare le nom de la dernière extension', () => {
    expect(separerNom('ma.photo.JPG')).toEqual({ base: 'ma.photo', extension: '.JPG' })
    expect(separerNom('ma.photo.jpeg.jpg')).toEqual({ base: 'ma.photo.jpeg', extension: '.jpg' })
  })

  it('gère les noms sans extension', () => {
    expect(separerNom('photo')).toEqual({ base: 'photo', extension: '' })
    expect(separerNom('.caché')).toEqual({ base: '.caché', extension: '' })
  })

  it('affiche le nom sans extension', () => {
    expect(nomAffiche('ma.photo.JPG')).toBe('ma.photo')
    expect(nomAffiche('photo')).toBe('photo')
  })

  it('nettoie un nom saisi', () => {
    expect(assainirNom('Été à la plage !')).toBe('ete-a-la-plage')
    expect(assainirNom('  Photo (1)  ')).toBe('photo-1')
  })

  it('formate le poids', () => {
    expect(formatPoids(842 * 1024)).toBe('842 Ko')
    expect(formatPoids(1.5 * 1024 * 1024)).toBe('1,5 Mo')
    expect(formatPoids(null)).toBe('—')
  })
})
