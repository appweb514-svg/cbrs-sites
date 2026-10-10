// Noms d’instantanés : AAAA-MM-JJ_HHmm (heure locale du serveur).
const ZERO = (n: number) => String(n).padStart(2, '0')

export const nomInstantane = (date: Date): string =>
  `${date.getFullYear()}-${ZERO(date.getMonth() + 1)}-${ZERO(date.getDate())}_${ZERO(date.getHours())}${ZERO(date.getMinutes())}`

export const estNomInstantane = (nom: string): boolean => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(nom)

// Date portée par un nom commençant par AAAA-MM-JJ (instantané, archive ou base distante), sinon null.
export const dateDuNom = (nom: string): Date | null => {
  const trouve = /^(\d{4})-(\d{2})-(\d{2})/.exec(nom.replace(/\/+$/, ''))
  if (!trouve) return null
  const date = new Date(Number(trouve[1]), Number(trouve[2]) - 1, Number(trouve[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

// Noms à supprimer : plus vieux que `conservationJours` jours. Les noms sans date sont ignorés,
// et le plus récent est toujours gardé (jamais de purge qui viderait tout).
export const aPurger = (noms: string[], maintenant: Date, conservationJours: number): string[] => {
  const datés = noms.flatMap((nom) => {
    const date = dateDuNom(nom)
    return date ? [{ nom, date }] : []
  })
  if (datés.length <= 1) return []
  const recent = datés.reduce((a, b) => (b.nom > a.nom ? b : a)).nom
  const limite = maintenant.getTime() - conservationJours * 86_400_000
  return datés.filter(({ nom, date }) => nom !== recent && date.getTime() < limite).map(({ nom }) => nom)
}
