'use client'

import type { UIFieldClientComponent } from 'payload'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { COULEURS_ORIGINE, INTENSITE_TEINTE_ORIGINE } from '../couleurs'

// Image du bandeau livrée avec le site : affichée tant qu'aucune image par défaut n'est choisie.
const IMAGE_SITE = 'https://cbrs-sites.vercel.app/assets/hero-plan-eau-canada.jpg'

// Voile d'origine du site (site3/ui-shell.css) : trois couleurs, opacités relatives 1 / 0,641 / 0,744.
const VOILE_ORIGINE = ['10, 50, 115', '30, 75, 153', '20, 92, 117'] as const

const rgb = (hex: string, eclaircir = 0) =>
  [1, 3, 5]
    .map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16)
      return Math.round(c + (255 - c) * eclaircir)
    })
    .join(', ')

// Même calcul que site3/cms-client.js (themeFrom) : c1 = c3 = teinte, c2 = teinte éclaircie de 15 %.
const voile = (teinte: unknown, intensite: unknown) => {
  const hex =
    typeof teinte === 'string' && /^#[0-9a-f]{6}$/i.test(teinte) ? teinte.toLowerCase() : ''
  const [c1, c2, c3] =
    hex && hex !== COULEURS_ORIGINE.teinteEnTete
      ? [rgb(hex), rgb(hex, 0.15), rgb(hex)]
      : VOILE_ORIGINE
  const o =
    (typeof intensite === 'number'
      ? Math.min(100, Math.max(0, intensite))
      : INTENSITE_TEINTE_ORIGINE) / 100
  return `linear-gradient(120deg, rgba(${c1}, ${o}), rgba(${c2}, ${o * 0.641}) 55%, rgba(${c3}, ${o * 0.744}))`
}

type Photo = { id?: number | string; url?: string | null }

// Aperçu du bandeau : image actuelle (celle du site tant qu'aucune n'est choisie) sous la teinte réglée.
export const ApercuEnTete: UIFieldClientComponent = () => {
  const image = useFormFields(([champs]) => champs.imageEnTete?.value) as
    null | number | Photo | string | undefined
  const teinte = useFormFields(([champs]) => champs.teinteEnTete?.value)
  const intensite = useFormFields(([champs]) => champs.intensiteTeinte?.value)
  const [chargee, setChargee] = React.useState<Photo | null>(null)

  const id = image && typeof image === 'object' ? image.id : image
  const urlConnue = image && typeof image === 'object' ? image.url : null

  React.useEffect(() => {
    if (urlConnue || id === null || id === undefined || id === '') return
    let actif = true
    fetch(`/api/media/${id}?depth=0`, { credentials: 'include' })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((photo: null | Photo) => {
        if (actif) setChargee(photo ? { id, url: photo.url } : null)
      })
      .catch(() => undefined)
    return () => {
      actif = false
    }
  }, [id, urlConnue])

  const url = urlConnue ?? (chargee && chargee.id === id ? (chargee.url ?? null) : null)

  const choisie = id !== null && id !== undefined && id !== ''

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <p className="field-label" style={{ marginBottom: '0.4rem' }}>
        Aperçu de l’en-tête
      </p>
      <div
        aria-label="Aperçu de l’en-tête du site"
        role="img"
        style={{
          aspectRatio: '16 / 5',
          backgroundColor: 'var(--theme-elevation-100)',
          borderRadius: 8,
          maxWidth: 720,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {(url || !choisie) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            src={url ?? IMAGE_SITE}
            style={{
              height: '100%',
              inset: 0,
              objectFit: 'cover',
              position: 'absolute',
              width: '100%',
            }}
          />
        )}
        <div style={{ background: voile(teinte, intensite), inset: 0, position: 'absolute' }} />
        <span
          style={{
            bottom: '1rem',
            color: '#fff',
            fontSize: '1.4rem',
            fontWeight: 700,
            left: '1.25rem',
            position: 'absolute',
          }}
        >
          Titre de la page
        </span>
      </div>
      <p style={{ fontSize: 12, marginTop: '0.4rem', opacity: 0.7 }}>
        {choisie
          ? 'Image par défaut choisie ci-dessous, avec la teinte et l’intensité réglées.'
          : 'Image actuelle du site (aucune image par défaut choisie), avec la teinte et l’intensité réglées.'}
      </p>
    </div>
  )
}
