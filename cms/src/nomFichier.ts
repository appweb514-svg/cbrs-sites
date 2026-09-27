// Nom de fichier : séparation base/extension, nettoyage et affichage.
// Partagé entre le serveur (endpoint de renommage) et l'administration (liste, propriétés).

// Longueur maximale d'un nom saisi (hors extension).
export const NOM_MAX = 80

// « ma.photo.JPG » → { base: 'ma.photo', extension: '.JPG' } ; « photo » → extension vide.
export const separerNom = (nom: string): { base: string; extension: string } => {
  const point = nom.lastIndexOf('.')
  if (point <= 0) return { base: nom, extension: '' }
  return { base: nom.slice(0, point), extension: nom.slice(point) }
}

// Nom montré dans l'administration : sans l'extension.
export const nomAffiche = (nom: string): string => separerNom(nom).base

// « Été à la plage !.jpg » → « ete-a-la-plage » : minuscules sans accents,
// lettres, chiffres, tirets et tirets bas uniquement, le reste remplacé par un tiret.
export const assainirNom = (nom: string): string =>
  nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Poids lisible : « 842 Ko », « 1,5 Mo ».
export const formatPoids = (octets?: number | null): string => {
  if (octets == null || !Number.isFinite(octets)) return '—'
  const ko = octets / 1024
  if (ko < 1024) return `${Math.round(ko)} Ko`
  return `${(ko / 1024).toFixed(1).replace('.', ',')} Mo`
}
