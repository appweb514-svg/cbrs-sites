import type { CollectionConfig, Field } from 'payload'

// Cellule de liste qui affiche ✓ / ✗ : chemin résolu par l'importMap de l'administration.
export const CELLULE_CASE = '/admin/CaseCellule#CaseCellule'

type ChampImbrique = Field & { fields?: Field[]; tabs?: { fields: Field[] }[] }

// Parcourt les champs imbriqués (rangée, onglets, groupe, repliable, liste) pour remplacer
// l'affichage des cases à cocher dans les listes.
const avecCelluleCase = (field: Field): Field => {
  if (field.type === 'checkbox') {
    return {
      ...field,
      admin: { ...field.admin, components: { ...field.admin?.components, Cell: CELLULE_CASE } },
    }
  }

  const champ = field as ChampImbrique
  if (Array.isArray(champ.tabs)) {
    return { ...champ, tabs: champ.tabs.map((onglet) => ({ ...onglet, fields: onglet.fields.map(avecCelluleCase) })) } as Field
  }
  if (Array.isArray(champ.fields)) {
    return { ...champ, fields: champ.fields.map(avecCelluleCase) } as Field
  }
  return field
}

// Toutes les cases à cocher des collections s'affichent en ✓ vert / ✗ rouge dans les listes.
export const avecCasesVX = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((collection) => ({ ...collection, fields: collection.fields.map(avecCelluleCase) }))
