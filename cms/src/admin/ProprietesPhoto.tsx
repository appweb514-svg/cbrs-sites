'use client'

import { Link, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { formatPoids } from '../nomFichier'

// Date « 27/09/2026 14:05 » : construite sans toLocaleString pour un rendu identique serveur et navigateur.
const dateFr = (valeur: unknown): string => {
  const date = new Date(String(valeur ?? ''))
  if (Number.isNaN(date.getTime())) return '—'
  const deux = (nombre: number) => String(nombre).padStart(2, '0')
  return `${deux(date.getDate())}/${deux(date.getMonth() + 1)}/${date.getFullYear()} ${deux(date.getHours())}:${deux(date.getMinutes())}`
}

const formatFichier = (mime: unknown): string => {
  const sous = String(mime ?? '').split('/')[1] ?? ''
  if (!sous) return '—'
  if (sous === 'jpeg') return 'JPEG'
  if (sous === 'svg+xml') return 'SVG'
  return sous.toUpperCase()
}

const orientation = (largeur: number, hauteur: number): string => {
  if (!largeur || !hauteur) return '—'
  if (largeur > hauteur) return 'Paysage'
  if (largeur < hauteur) return 'Portrait'
  return 'Carré'
}

const Ligne: React.FC<{ label: string; valeur: React.ReactNode }> = ({ label, valeur }) => (
  <p style={{ margin: '0 0 0.4rem' }}>
    <span style={{ opacity: 0.7 }}>{label} : </span>
    {valeur}
  </p>
)

// Propriétés du fichier (barre latérale) : dimensions, poids, format, dates et présence dans la galerie du site.
export const ProprietesPhoto: React.FC = () => {
  const { id, savedDocumentData } = useDocumentInfo()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  // Fiche de la photo dans la galerie : son identifiant, false si absente, null tant qu'inconnue.
  const [ficheGalerie, setFicheGalerie] = React.useState<false | null | number | string>(null)

  React.useEffect(() => {
    if (!id) return
    let actif = true
    fetch(`/api/galerie?limit=1&depth=0&where[photo][equals]=${encodeURIComponent(String(id))}`, {
      credentials: 'include',
    })
      .then((reponse) => (reponse.ok ? reponse.json() : { docs: [] }))
      .then((donnees: { docs?: { id: number | string }[] }) => {
        if (actif) setFicheGalerie(donnees?.docs?.[0]?.id ?? false)
      })
      .catch(() => {
        if (actif) setFicheGalerie(null)
      })
    return () => {
      actif = false
    }
  }, [id])

  if (!id || !savedDocumentData) return null

  const largeur = Number(savedDocumentData.width) || 0
  const hauteur = Number(savedDocumentData.height) || 0

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ margin: '0 0 0.6rem' }}>Propriétés</h4>
      <Ligne label="Dimensions" valeur={largeur && hauteur ? `${largeur} × ${hauteur} px` : '—'} />
      <Ligne label="Orientation" valeur={orientation(largeur, hauteur)} />
      <Ligne label="Poids" valeur={formatPoids(Number(savedDocumentData.filesize) || null)} />
      <Ligne label="Format" valeur={formatFichier(savedDocumentData.mimeType)} />
      <Ligne label="Ajoutée le" valeur={dateFr(savedDocumentData.createdAt)} />
      <Ligne label="Modifiée le" valeur={dateFr(savedDocumentData.updatedAt)} />
      <p style={{ margin: '0.6rem 0 0' }}>
        Dans la galerie du site : {ficheGalerie === null ? '…' : ficheGalerie ? '✓' : '✗'}
      </p>
      {ficheGalerie ? (
        <p style={{ margin: '0.3rem 0 0' }}>
          <Link
            href={formatAdminURL({
              adminRoute,
              path: `/collections/galerie/${encodeURIComponent(String(ficheGalerie))}`,
            })}
            prefetch={false}
          >
            Légende, catégorie et année →
          </Link>
        </p>
      ) : null}
    </div>
  )
}
