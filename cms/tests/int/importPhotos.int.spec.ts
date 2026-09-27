import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'

import { estImage, extraireImagesZip, nomSansExtension } from '@/admin/importPhotos'

describe('Import des photos', () => {
  it('reconnaît les images et écarte les autres fichiers', () => {
    for (const nom of ['photo.jpg', 'Photo.JPEG', 'album/sous-dossier/image.png', 'animation.gif', 'vue.webp']) {
      expect(estImage(nom), nom).toBe(true)
    }
    for (const nom of [
      'notes.txt',
      'document.pdf',
      'sans-extension',
      '__MACOSX/photo.jpg',
      '__MACOSX/._photo.jpg',
      '.cache/photo.jpg',
      '.photo.jpg',
    ]) {
      expect(estImage(nom), nom).toBe(false)
    }
  })

  it('extrait les images d’une archive zip', () => {
    const archive = zipSync({
      'album/balade-1.jpg': strToU8('première'),
      'album/balade-2.PNG': strToU8('deuxième'),
      'album/lisez-moi.txt': strToU8('notes'),
      '__MACOSX/balade-1.jpg': strToU8('ressource macOS'),
    })

    const images = extraireImagesZip(archive)

    expect(images.map((image) => image.nom)).toEqual(['balade-1.jpg', 'balade-2.PNG'])
    for (const image of images) expect(image.octets.length).toBeGreaterThan(0)
  })

  it('déduit la légende du nom du fichier', () => {
    expect(nomSansExtension('balade-1.jpg')).toBe('balade-1')
    expect(nomSansExtension('album/Sortie au Touquet 2026.jpeg')).toBe('Sortie au Touquet 2026')
    expect(nomSansExtension('sans-extension')).toBe('sans-extension')
  })
})
