import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

// Les routes personnalisées (/api/...) ne doivent pas empiéter sur l'espace de noms REST
// d'une collection : Payload interpréterait « /galerie/lot » comme un findByID sur l'id « lot ».
describe('Routes personnalisées', () => {
  it('aucun endpoint ne masque une collection ou un global', () => {
    const racines: string[] = [...payload.config.collections, ...payload.config.globals].map(({ slug }) => slug)
    const collisions = (payload.config.endpoints ?? [])
      .map((endpoint) => (typeof endpoint === 'string' ? endpoint : endpoint.path))
      .map((chemin) => chemin.replace(/^\//, '').split('/')[0])
      .filter((racine) => racines.includes(racine))

    expect(collisions).toEqual([])
  })

  it('expose l’action en lot de la galerie', () => {
    const chemins = (payload.config.endpoints ?? []).map((endpoint) =>
      typeof endpoint === 'string' ? endpoint : endpoint.path,
    )
    expect(chemins).toContain('/galerie-lot')
  })
})
