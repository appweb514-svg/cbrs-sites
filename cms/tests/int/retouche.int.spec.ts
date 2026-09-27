import { describe, expect, it } from 'vitest'

import {
  bornerCadre,
  cadreRecadrage,
  dimensionsAvecContour,
  filtreCss,
  OPTIONS_DEFAUT,
  pointInteret,
  positionTexte,
} from '@/retouche'

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

  describe('cadreRecadrage', () => {
    it('prend toute la photo en format libre', () => {
      expect(cadreRecadrage(1000, 800, null)).toEqual({ x: 0, y: 0, largeur: 1000, hauteur: 800 })
    })

    it('centre le plus grand cadre possible pour le format demandé', () => {
      // Photo plus large que haute : le carré est limité par la hauteur.
      expect(cadreRecadrage(1000, 800, 1)).toEqual({ x: 100, y: 0, largeur: 800, hauteur: 800 })
      // Photo plus haute que large : le carré est limité par la largeur.
      expect(cadreRecadrage(800, 1000, 1)).toEqual({ x: 0, y: 100, largeur: 800, hauteur: 800 })
      // 16:9 plus large que la photo : le cadre est limité par la largeur.
      expect(cadreRecadrage(1000, 800, 16 / 9)).toEqual({ x: 0, y: 119, largeur: 1000, hauteur: 563 })
      // 4:3 moins large que la photo : le cadre est limité par la hauteur.
      expect(cadreRecadrage(1000, 600, 4 / 3)).toEqual({ x: 100, y: 0, largeur: 800, hauteur: 600 })
    })
  })

  describe('bornerCadre', () => {
    it('ramène un cadre trop grand ou sorti de la photo', () => {
      expect(bornerCadre({ x: -20, y: -10, largeur: 1200, hauteur: 900 }, 1000, 800)).toEqual({
        x: 0,
        y: 0,
        largeur: 1000,
        hauteur: 800,
      })
    })

    it('colle un cadre qui dépasse d’un bord', () => {
      expect(bornerCadre({ x: 900, y: 700, largeur: 200, hauteur: 150 }, 1000, 800)).toEqual({
        x: 800,
        y: 650,
        largeur: 200,
        hauteur: 150,
      })
    })
  })

  describe('pointInteret', () => {
    it('convertit un clic en pourcentages arrondis', () => {
      expect(pointInteret(250, 200, 1000, 800)).toEqual({ focalX: 25, focalY: 25 })
      expect(pointInteret(500, 120, 1000, 800)).toEqual({ focalX: 50, focalY: 15 })
    })

    it('borne le point entre 0 et 100', () => {
      expect(pointInteret(-50, 2000, 1000, 800)).toEqual({ focalX: 0, focalY: 100 })
    })
  })
})
