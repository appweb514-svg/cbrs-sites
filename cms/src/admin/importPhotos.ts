import { unzipSync } from 'fflate'

// Formats acceptés à l'import ; le reste (PDF, vidéos…) est ignoré.
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

const TYPES_MIME: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const parties = (nom: string) => nom.replace(/\\/g, '/').split('/').filter(Boolean)

const extension = (nom: string): string => {
  const base = parties(nom).pop() ?? ''
  const point = base.lastIndexOf('.')
  return point === -1 ? '' : base.slice(point + 1).toLowerCase()
}

// Nom du fichier sans dossier ni extension : sert de légende et de description de la photo.
export const nomSansExtension = (nom: string): string => {
  const base = parties(nom).pop() ?? nom
  const point = base.lastIndexOf('.')
  return point > 0 ? base.slice(0, point) : base
}

export const typeMime = (nom: string): string => TYPES_MIME[extension(nom)] ?? 'application/octet-stream'

// Une image importable : extension connue, hors fichiers cachés et ressources macOS des archives.
export const estImage = (nom: string): boolean => {
  const morceaux = parties(nom)
  if (morceaux.some((morceau) => morceau.startsWith('.') || morceau === '__MACOSX')) return false
  return EXTENSIONS.includes(extension(nom))
}

export type ImageImportee = { nom: string; octets: Uint8Array }

// Images contenues dans une archive zip (dossiers ignorés, ordre de l'archive conservé).
export const extraireImagesZip = (octets: Uint8Array): ImageImportee[] =>
  Object.entries(unzipSync(octets))
    .filter(([nom, contenu]) => estImage(nom) && contenu.length > 0)
    .map(([nom, contenu]) => ({ nom: parties(nom).pop() ?? nom, octets: contenu }))
