import { describe, expect, it } from 'vitest'

import { dimensionsAvecContour, filtreCss, OPTIONS_DEFAUT, positionTexte } from '@/retouche'

describe('Retouche d’une photo', () => {
  describe('filtreCss', () => {
    it('ne filtre rien par défaut', () => {
      expect(filtreCss(OPTIONS_DEFAUT)).toBe('none')
    })

    it('combine le filtre choisi et les curseurs', () => {
      expect(filtreCss({ ...OPTIONS_DEFAUT, filtre: 'sepia', luminosite: 25 })).toBe('sepia(0.85) brightness(1.25)')
      expect(filtreCss({ ...OPTIONS_DEFAUT, contraste: 50, saturation: -50 })).toBe('contrast(1.5) saturate(0.5)')
    })
  })

  describe('positionTexte', () => {
    it('place le texte dans les angles avec la marge demandée', () => {
      expect(positionTexte('haut-gauche', 200, 100, 10)).toEqual({ x: 10, y: 10, align: 'left', baseline: 'top' })
      expect(positionTexte('bas-droite', 200, 100, 10)).toEqual({ x: 190, y: 90, align: 'right', baseline: 'bottom' })
    })

    it('centre le texte', () => {
      expect(positionTexte('centre', 200, 100, 10)).toEqual({ x: 100, y: 50, align: 'center', baseline: 'middle' })
      expect(positionTexte('bas-centre', 200, 100, 10)).toEqual({ x: 100, y: 90, align: 'center', baseline: 'bottom' })
    })
  })

  describe('dimensionsAvecContour', () => {
    it('n’ajoute rien sans contour', () => {
      expect(dimensionsAvecContour(1000, 800, { type: 'aucun' })).toEqual({ largeur: 1000, hauteur: 800, decalage: 0 })
    })

    it('calcule un cadre proportionnel à la photo', () => {
      expect(dimensionsAvecContour(1000, 800, { type: 'fin' })).toEqual({ largeur: 1020, hauteur: 820, decalage: 10 })
      expect(dimensionsAvecContour(1000, 800, { type: 'epais' })).toEqual({ largeur: 1064, hauteur: 864, decalage: 32 })
    })

    it('respecte l’épaisseur choisie pour un contour de couleur', () => {
      expect(dimensionsAvecContour(1000, 800, { type: 'couleur', epaisseur: 24 })).toEqual({
        largeur: 1048,
        hauteur: 848,
        decalage: 24,
      })
    })
  })
})
