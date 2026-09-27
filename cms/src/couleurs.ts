// Couleurs du site : valeurs d'origine, contrôle de lisibilité et palette proposée dans l'administration.
// Partagé entre le serveur (validation) et l'administrateur (nuancier).

export const COULEURS_ORIGINE = {
  couleurPrincipale: '#0a3273',
  couleurSecondaire: '#437c14',
  couleurAccent: '#145c75',
  teinteEnTete: '#0a3273',
} as const

export type NomCouleur = keyof typeof COULEURS_ORIGINE

// Intensité d'origine de la teinte d'en-tête : opacité du voile actuel du site, en pourcentage.
export const INTENSITE_TEINTE_ORIGINE = 78

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Rapport de contraste avec le blanc (texte blanc sur boutons et bandeaux).
export const contrasteAvecBlanc = (hex: string) => 1.05 / (luminance(hex) + 0.05)

export const lisibleAvecBlanc = (hex: string) => /^#[0-9a-fA-F]{6}$/.test(hex) && contrasteAvecBlanc(hex) >= 4.5

export const COULEUR_ORIGINE_PLACEHOLDER = '#0a3273'

// Nuancier : teintes soutenues, toutes lisibles avec du texte blanc (contraste ≥ 4,5:1).
export const PALETTE: { famille: string; teintes: string[] }[] = [
  { famille: 'Bleus', teintes: ['#0a3273', '#1e4b99', '#123c7a', '#0f3f66', '#1b3a5c', '#0d2f52', '#204a87', '#2b5f8a'] },
  { famille: 'Verts', teintes: ['#437c14', '#3b6e11', '#2f6b2f', '#1e6b4f', '#1b7a4b', '#3d7a2e', '#2e6f1e', '#4a7c2f'] },
  { famille: 'Bleu-vert', teintes: ['#145c75', '#0f5f6b', '#156b73', '#1a5f8a', '#0e5a6b', '#17606f'] },
  { famille: 'Violets', teintes: ['#5b1a8a', '#6a2f8f', '#4a2470', '#7a2f6b', '#5e2a6e'] },
  { famille: 'Rouges et bruns', teintes: ['#8f1d1d', '#a02c2c', '#7a2a1e', '#8a3b12', '#6f3b1f', '#7d2f3f', '#93412f'] },
  { famille: 'Foncés', teintes: ['#1f2937', '#374151', '#4b5563', '#2d3748', '#44403c', '#3f3f46'] },
]

export const TEINTES = PALETTE.flatMap((famille) => famille.teintes)
