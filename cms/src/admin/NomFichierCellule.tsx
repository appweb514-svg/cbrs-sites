'use client'

import { DefaultCell } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import React from 'react'

import { nomAffiche } from '../nomFichier'

// Colonne « Nom du fichier » : le nom est montré sans son extension (le reste du rendu est celui par défaut).
export const NomFichierCellule: React.FC<DefaultCellComponentProps> = (props) =>
  typeof props.cellData === 'string' ? (
    <DefaultCell {...props} cellData={nomAffiche(props.cellData)} />
  ) : (
    <DefaultCell {...props} />
  )
