'use client'

import { Thumbnail, useListRelationships } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import React from 'react'

import { nomAffiche } from '../nomFichier'

type PhotoMedia = {
  filename?: null | string
  sizes?: null | { vignette?: null | { url?: null | string } }
  thumbnailURL?: null | string
  url?: null | string
}

// Colonne « Photo » de la galerie : la vignette de Payload, mais le nom du fichier sans son extension.
export const GaleriePhotoCellule: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const { documents, getRelationships } = useListRelationships()
  const id = typeof cellData === 'number' || typeof cellData === 'string' ? cellData : null

  React.useEffect(() => {
    if (id !== null) getRelationships([{ relationTo: 'media', value: id }])
  }, [getRelationships, id])

  const photo = (id === null ? null : documents.media?.[id]) as null | PhotoMedia | undefined
  if (!photo || typeof photo !== 'object' || !photo.filename) return <span />

  // Même choix de vignette que Payload : la taille « vignette », sinon l'aperçu, sinon l'original.
  const source = photo.sizes?.vignette?.url ?? photo.thumbnailURL ?? photo.url ?? ''

  return (
    <div className="file">
      <Thumbnail
        className="file__thumbnail"
        collectionSlug="media"
        doc={{ filename: photo.filename }}
        fileSrc={source}
        size="small"
      />
      <span className="file__filename">{nomAffiche(photo.filename)}</span>
    </div>
  )
}
