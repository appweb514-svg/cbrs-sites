// Retouche d'une photo dans l'administration : filtres, texte et contours.
// Les calculs sont des fonctions pures, testables sans canvas.

export type FiltreNom = 'aucun' | 'noir-blanc' | 'sepia' | 'chaud' | 'froid' | 'vif' | 'doux' | 'vintage'

export const FILTRES: { label: string; value: FiltreNom }[] = [
  { label: 'Aucun', value: 'aucun' },
  { label: 'Noir et blanc', value: 'noir-blanc' },
  { label: 'Sépia', value: 'sepia' },
  { label: 'Chaud', value: 'chaud' },
  { label: 'Froid', value: 'froid' },
  { label: 'Vif', value: 'vif' },
  { label: 'Doux', value: 'doux' },
  { label: 'Vintage', value: 'vintage' },
]

// Rendus CSS passés à ctx.filter (mêmes noms que les filtres du navigateur).
const FILTRES_CSS: Record<FiltreNom, string> = {
  aucun: '',
  'noir-blanc': 'grayscale(1)',
  sepia: 'sepia(0.85)',
  chaud: 'sepia(0.3) saturate(1.25) hue-rotate(-12deg)',
  froid: 'sepia(0.35) hue-rotate(180deg) saturate(1.5)',
  vif: 'saturate(1.45) contrast(1.12)',
  doux: 'saturate(0.85) contrast(0.92) brightness(1.06)',
  vintage: 'sepia(0.5) saturate(0.85) contrast(0.9) brightness(1.05)',
}

export type PositionTexte =
  | 'haut-gauche'
  | 'haut-centre'
  | 'haut-droite'
  | 'centre-gauche'
  | 'centre'
  | 'centre-droite'
  | 'bas-gauche'
  | 'bas-centre'
  | 'bas-droite'

export const POSITIONS_TEXTE: { label: string; value: PositionTexte }[] = [
  { label: 'En haut à gauche', value: 'haut-gauche' },
  { label: 'En haut au centre', value: 'haut-centre' },
  { label: 'En haut à droite', value: 'haut-droite' },
  { label: 'Au milieu à gauche', value: 'centre-gauche' },
  { label: 'Au centre', value: 'centre' },
  { label: 'Au milieu à droite', value: 'centre-droite' },
  { label: 'En bas à gauche', value: 'bas-gauche' },
  { label: 'En bas au centre', value: 'bas-centre' },
  { label: 'En bas à droite', value: 'bas-droite' },
]

export type ContourNom = 'aucun' | 'fin' | 'epais' | 'noir' | 'couleur'

export const CONTOURS: { label: string; value: ContourNom }[] = [
  { label: 'Aucun', value: 'aucun' },
  { label: 'Fin blanc', value: 'fin' },
  { label: 'Épais blanc (polaroïd)', value: 'epais' },
  { label: 'Noir', value: 'noir' },
  { label: 'Couleur au choix', value: 'couleur' },
]

export type Contour = { type: ContourNom; epaisseur?: number }

export type OptionsRetouche = {
  filtre: FiltreNom
  luminosite: number
  contraste: number
  saturation: number
  texte: string
  police: string
  taille: number
  couleurTexte: string
  gras: boolean
  ombre: boolean
  position: PositionTexte
  contour: ContourNom
  couleurContour: string
  epaisseurContour: number
  coinsArrondis: number
  vignettage: boolean
}

export const OPTIONS_DEFAUT: OptionsRetouche = {
  filtre: 'aucun',
  luminosite: 0,
  contraste: 0,
  saturation: 0,
  texte: '',
  police: 'defaut',
  taille: 6,
  couleurTexte: '#ffffff',
  gras: true,
  ombre: true,
  position: 'bas-centre',
  contour: 'aucun',
  couleurContour: '#ffffff',
  epaisseurContour: 12,
  coinsArrondis: 0,
  vignettage: false,
}

// Filtre choisi puis curseurs, pour ctx.filter. Aucun réglage → « none ».
export const filtreCss = (options: OptionsRetouche): string => {
  const parties = [FILTRES_CSS[options.filtre]]
  if (options.luminosite) parties.push(`brightness(${1 + options.luminosite / 100})`)
  if (options.contraste) parties.push(`contrast(${1 + options.contraste / 100})`)
  if (options.saturation) parties.push(`saturate(${1 + options.saturation / 100})`)
  return parties.filter(Boolean).join(' ') || 'none'
}

// Point d'ancrage du texte (marge en pixels depuis les bords).
export const positionTexte = (
  position: PositionTexte,
  largeur: number,
  hauteur: number,
  marge: number,
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } => {
  const [ligne, colonne] = position === 'centre' ? ['centre', 'centre'] : position.split('-')
  const x = colonne === 'gauche' ? marge : colonne === 'droite' ? largeur - marge : largeur / 2
  const y = ligne === 'haut' ? marge : ligne === 'bas' ? hauteur - marge : hauteur / 2
  return {
    x: Math.round(x),
    y: Math.round(y),
    align: colonne === 'gauche' ? 'left' : colonne === 'droite' ? 'right' : 'center',
    baseline: ligne === 'haut' ? 'top' : ligne === 'bas' ? 'bottom' : 'middle',
  }
}

// Cadre de recadrage, en pixels de la photo d'origine.
export type Cadre = { x: number; y: number; largeur: number; hauteur: number }

// Formats de recadrage : ratio largeur/hauteur, null = format libre (photo entière).
export const RATIOS: { label: string; value: null | number }[] = [
  { label: 'Libre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
]

// Cadre centré le plus grand possible pour le format demandé ; toute la photo en format libre.
export const cadreRecadrage = (largeur: number, hauteur: number, ratio: null | number): Cadre => {
  if (largeur <= 0 || hauteur <= 0) return { x: 0, y: 0, largeur: 0, hauteur: 0 }
  if (!ratio || ratio <= 0) return { x: 0, y: 0, largeur, hauteur }
  const largeurCadre = Math.round(Math.min(largeur, hauteur * ratio))
  const hauteurCadre = Math.round(largeurCadre / ratio)
  return {
    x: Math.round((largeur - largeurCadre) / 2),
    y: Math.round((hauteur - hauteurCadre) / 2),
    largeur: largeurCadre,
    hauteur: hauteurCadre,
  }
}

// Garde le cadre dans la photo, avec des mesures entières d'au moins un pixel.
export const bornerCadre = (cadre: Cadre, largeur: number, hauteur: number): Cadre => {
  const largeurCadre = Math.min(Math.max(1, Math.round(cadre.largeur)), Math.max(1, largeur))
  const hauteurCadre = Math.min(Math.max(1, Math.round(cadre.hauteur)), Math.max(1, hauteur))
  return {
    x: Math.min(Math.max(0, Math.round(cadre.x)), largeur - largeurCadre),
    y: Math.min(Math.max(0, Math.round(cadre.y)), hauteur - hauteurCadre),
    largeur: largeurCadre,
    hauteur: hauteurCadre,
  }
}

// Point d'intérêt Payload (0-100 %) à partir d'un clic exprimé en pixels de la photo.
export const pointInteret = (
  xPx: number,
  yPx: number,
  largeur: number,
  hauteur: number,
): { focalX: number; focalY: number } => {
  const pourcent = (valeur: number, total: number) =>
    total > 0 ? Math.min(100, Math.max(0, Math.round((valeur / total) * 100))) : 50
  return { focalX: pourcent(xPx, largeur), focalY: pourcent(yPx, hauteur) }
}

// Épaisseur du contour : la plus petite dimension sert de référence pour les contours automatiques.
const epaisseurContour = ({ type, epaisseur }: Contour, cote: number): number => {
  if (type === 'aucun') return 0
  if (type === 'fin') return Math.max(2, Math.round(cote * 0.012))
  if (type === 'epais') return Math.max(6, Math.round(cote * 0.04))
  if (type === 'noir') return Math.max(2, Math.round(cote * 0.01))
  return Math.max(0, Math.round(epaisseur ?? 0))
}

// Dimensions du canvas avec le contour : `decalage` = position de la photo dans le cadre.
export const dimensionsAvecContour = (
  largeur: number,
  hauteur: number,
  contour: Contour,
): { largeur: number; hauteur: number; decalage: number } => {
  const epaisseur = epaisseurContour(contour, Math.min(largeur, hauteur))
  return { largeur: largeur + epaisseur * 2, hauteur: hauteur + epaisseur * 2, decalage: epaisseur }
}

// Couleur du cadre, ou null si aucun contour.
export const couleurContour = (options: OptionsRetouche): null | string => {
  if (options.contour === 'aucun') return null
  if (options.contour === 'couleur') return options.couleurContour
  return options.contour === 'noir' ? '#000000' : '#ffffff'
}
