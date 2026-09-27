'use client'

import { DefaultCell, useListDrawerContext } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import React from 'react'

import { nomAffiche } from '../nomFichier'

// Colonne « Nom du fichier » : le nom est montré sans son extension (le reste du rendu est celui par défaut).
// Dans un tiroir de choix (« Choisir parmi les existant(e)s »), un clic sélectionne la photo au lieu d'ouvrir
// sa fiche, comme le fait la cellule par défaut de Payload (RenderDefaultCell), que la cellule personnalisée remplace.
export const NomFichierCellule: React.FC<DefaultCellComponentProps> = (props) => {
  const { drawerSlug, onSelect } = useListDrawerContext()
  const onClick: DefaultCellComponentProps['onClick'] = ({ collectionSlug, rowData }) =>
    onSelect?.({ collectionSlug, doc: rowData, docID: rowData.id as string })
  const selection = drawerSlug && props.link ? { link: false, onClick } : {}
  const cellData = typeof props.cellData === 'string' ? nomAffiche(props.cellData) : props.cellData
  return <DefaultCell {...props} {...selection} cellData={cellData} />
}
