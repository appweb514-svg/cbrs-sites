'use client'

import type { DefaultCellComponentProps } from 'payload'
import React from 'react'

// Cellule des listes pour les cases à cocher : ✓ vert si coché, ✗ rouge sinon.
export const CaseCellule: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const oui = Boolean(cellData)

  return (
    <span
      aria-label={oui ? 'Oui' : 'Non'}
      role="img"
      style={{ color: oui ? '#1a7f37' : '#c62828', fontWeight: 'bold' }}
      title={oui ? 'Oui' : 'Non'}
    >
      {oui ? '✓' : '✗'}
    </span>
  )
}
