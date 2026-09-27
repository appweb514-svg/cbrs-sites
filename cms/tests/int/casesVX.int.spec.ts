import type { CollectionConfig, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { CELLULE_CASE, avecCasesVX } from '@/casesVX'
import config from '@/payload.config'

type Champ = Field & { blocks?: { fields: Field[] }[]; fields?: Field[]; tabs?: { fields: Field[] }[] }

// Tous les champs, y compris ceux des rangées, onglets, groupes, repliables, listes et blocs.
const tousLesChamps = (fields: Field[]): Champ[] =>
  (fields as Champ[]).flatMap((champ) => [
    champ,
    ...(Array.isArray(champ.fields) ? tousLesChamps(champ.fields) : []),
    ...(Array.isArray(champ.tabs) ? champ.tabs.flatMap((onglet) => tousLesChamps(onglet.fields)) : []),
    ...(Array.isArray(champ.blocks) ? champ.blocks.flatMap((bloc) => tousLesChamps(bloc.fields)) : []),
  ])

const champs = (collections: readonly { fields: Field[] }[]): Champ[] =>
  collections.flatMap((collection) => tousLesChamps(collection.fields))

const caseCellule = (champ: Champ): unknown =>
  (champ.admin as undefined | { components?: { Cell?: unknown } })?.components?.Cell

const nom = (champ: Champ): string => String((champ as { name?: string }).name ?? champ.type)

// Collection d'essai : une case à cocher par structure imbriquée possible.
const collectionTest: CollectionConfig = {
  slug: 'essai',
  fields: [
    { name: 'directe', type: 'checkbox' },
    { name: 'texte', type: 'text' },
    { type: 'row', fields: [{ name: 'rangee', type: 'checkbox' }] },
    { name: 'liste', type: 'array', fields: [{ name: 'dansListe', type: 'checkbox' }] },
    { name: 'groupe', type: 'group', fields: [{ name: 'dansGroupe', type: 'checkbox' }] },
    { type: 'collapsible', label: 'Repliable', fields: [{ name: 'dansRepliable', type: 'checkbox' }] },
    { type: 'tabs', tabs: [{ label: 'Onglet', fields: [{ name: 'dansOnglet', type: 'checkbox' }] }] },
  ],
}

describe('Cases ✓ / ✗ des listes', () => {
  it('équipe chaque case à cocher de la configuration', async () => {
    const conf = await config
    const cases = champs(conf.collections).filter((champ) => champ.type === 'checkbox')

    expect(cases.length).toBeGreaterThan(0)
    for (const champ of cases) expect(caseCellule(champ), nom(champ)).toBe(CELLULE_CASE)
  })

  it('équipe les cases imbriquées et laisse les autres champs inchangés', () => {
    const [resultat] = avecCasesVX([collectionTest])

    const cases = champs([resultat]).filter((champ) => champ.type === 'checkbox')
    expect(cases.map((champ) => champ.name)).toEqual([
      'directe',
      'rangee',
      'dansListe',
      'dansGroupe',
      'dansRepliable',
      'dansOnglet',
    ])
    for (const champ of cases) expect(caseCellule(champ), nom(champ)).toBe(CELLULE_CASE)

    const autres = (collections: readonly { fields: Field[] }[]) =>
      champs(collections).filter(
        (champ) => champ.type !== 'checkbox' && !champ.fields && !champ.tabs && !champ.blocks,
      )
    expect(autres([resultat])).toEqual(autres([collectionTest]))
  })

  it('ne modifie pas la configuration reçue', () => {
    avecCasesVX([collectionTest])

    for (const champ of champs([collectionTest])) expect(caseCellule(champ), nom(champ)).toBeUndefined()
  })
})
