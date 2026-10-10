import { describe, expect, it } from 'vitest'

import { MASQUE, chiffrer, dechiffrer, estChiffre } from '@/secret'

describe('Secrets chiffrés', () => {
  it('aller-retour chiffrer / déchiffrer', () => {
    const chiffre = chiffrer('mot de passe é€ très secret')
    expect(chiffre.startsWith('enc:')).toBe(true)
    expect(chiffre).not.toContain('secret')
    expect(dechiffrer(chiffre)).toBe('mot de passe é€ très secret')
  })

  it('deux chiffrements du même texte diffèrent (IV aléatoire)', () => {
    expect(chiffrer('abc')).not.toBe(chiffrer('abc'))
  })

  it('une valeur déjà chiffrée n’est pas rechiffrée', () => {
    const chiffre = chiffrer('abc')
    expect(chiffrer(chiffre)).toBe(chiffre)
    expect(estChiffre(chiffre)).toBe(true)
    expect(estChiffre('abc')).toBe(false)
  })

  it('une valeur sans préfixe est renvoyée telle quelle, une valeur altérée est refusée', () => {
    expect(dechiffrer('clair')).toBe('clair')
    const chiffre = chiffrer('abc')
    const altere = `${chiffre.slice(0, -4)}AAAA`
    expect(() => dechiffrer(altere)).toThrow(/illisible/)
    expect(MASQUE).not.toBe('')
  })
})
