'use client'

import { Link, Thumbnail, useConfig, useListRelationships } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { nomAffiche } from '../nomFichier'

type PhotoMedia = {
  filename?: null | string
  sizes?: null | { vignette?: null | { url?: null | string } }
  thumbnailURL?: null | string
  url?: null | string
}

// Colonne « Photo » de la galerie : la vignette de Payload, mais le nom du fichier sans son extension.
export const GaleriePhotoCellule: React.FC<DefaultCellComponentProps> = ({
  cellData,
  collectionSlug,
  link,
  linkURL,
  onClick,
  rowData,
}) => {
  const { documents, getRelationships } = useListRelationships()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const id = typeof cellData === 'number' || typeof cellData === 'string' ? cellData : null

  React.useEffect(() => {
    if (id !== null) getRelationships([{ relationTo: 'media', value: id }])
  }, [getRelationships, id])

  const photo = (id === null ? null : documents.media?.[id]) as null | PhotoMedia | undefined
  if (!photo || typeof photo !== 'object' || !photo.filename) return <span />

  // Même choix de vignette que Payload : la taille « vignette », sinon l'aperçu, sinon l'original.
  const source = photo.sizes?.vignette?.url ?? photo.thumbnailURL ?? photo.url ?? ''

  const contenu = (
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

  // Comme la cellule native de Payload : dans un tiroir de sélection, un bouton.
  if (typeof onClick === 'function') {
    return (
      <button
        className="cbrs-cellule-bouton"
        onClick={() => onClick({ cellData, collectionSlug, rowData })}
        type="button"
      >
        {contenu}
      </button>
    )
  }

  // Dans la liste de la galerie : le nom mène à la fiche de la photo (propriétés, renommage, retouche).
  if (link) {
    const href =
      linkURL ??
      formatAdminURL({
        adminRoute,
        path: `/collections/media/${encodeURIComponent(String(id))}`,
      })
    return (
      <Link href={href} prefetch={false}>
        {contenu}
      </Link>
    )
  }

  return contenu
}
