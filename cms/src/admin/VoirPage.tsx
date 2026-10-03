'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

const PAGES: Record<string, string> = {
  formation: '/formation',
  'flash-info': '/',
  tarifs: '/adhesion',
  parametres: '/',
  apparence: '/',
}

export const VoirPage: React.FC = () => {
  const { globalSlug } = useDocumentInfo()
  const chemin = globalSlug && PAGES[globalSlug]
  if (!chemin) return null

  const origine = (process.env.NEXT_PUBLIC_CBRS_SITE_URL || 'https://cbrs-sites.vercel.app').replace(/\/+$/, '')
  return (
    <a
      className="cbrs-bouton btn btn--style-secondary"
      href={`${origine}${chemin}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Voir la page publique dans un nouvel onglet. Enregistrez vos modifications pour les afficher."
    >
      Voir la page
    </a>
  )
}
