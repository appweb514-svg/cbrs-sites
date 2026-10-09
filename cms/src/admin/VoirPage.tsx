'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React from 'react'

const PAGES: Record<string, string> = {
  formation: '/formation',
  'flash-info': '/',
  tarifs: '/adhesion',
  parametres: '/',
  apparence: '/',
}

export const VoirPage: React.FC = () => {
  const { globalSlug, collectionSlug } = useDocumentInfo()
  const slug = useFormFields(([champs]) => champs.slug?.value) as string | undefined
  // Fiche d'activité : /activite?id=<identifiant>, une fois l'identifiant saisi.
  const chemin =
    collectionSlug === 'activites'
      ? slug && `/activite?id=${encodeURIComponent(slug)}`
      : globalSlug && PAGES[globalSlug]
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
