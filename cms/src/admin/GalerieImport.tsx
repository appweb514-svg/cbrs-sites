'use client'

import { toast, useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

import { droits } from '../access'
import { ACTIVITES_GALERIE, CATEGORIES_GALERIE } from '../collections/Galerie'
import { estImage, extraireImagesZip, nomSansExtension, typeMime } from './importPhotos'

// Vercel refuse les corps de requête de plus de 4,5 Mo : on réduit au-delà de 4 Mo.
const POIDS_MAX = 4 * 1024 * 1024
const COTE_MAX = 2560
const QUALITE_JPEG = 0.85

const nombre = (valeur: number, mot: string) => `${valeur} ${mot}${valeur > 1 ? 's' : ''}`

const messageErreur = (donnees: unknown, defaut: string): string => {
  if (donnees && typeof donnees === 'object') {
    const { errors, message } = donnees as { errors?: { message?: string }[]; message?: string }
    const details = (errors ?? []).map((erreur) => erreur.message).filter(Boolean)
    if (details.length > 0) return details.join(' — ')
    if (message) return message
  }
  return defaut
}

const estArchive = (nom: string) => nom.toLowerCase().endsWith('.zip')

// Import de photos dans la galerie : plusieurs images ou une archive .zip, réduites si trop lourdes.
export const GalerieImport: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [annee, setAnnee] = React.useState(() => new Date().getFullYear())
  const [categorie, setCategorie] = React.useState('vie')
  const [activite, setActivite] = React.useState('')
  const [fichiers, setFichiers] = React.useState<File[]>([])
  const [survol, setSurvol] = React.useState(false)
  const [avancement, setAvancement] = React.useState<null | { faits: number; total: number }>(null)
  const [erreurs, setErreurs] = React.useState<string[]>([])

  const enCours = avancement !== null && avancement.faits < avancement.total

  if (!droits(user, 'galerie', 'creer').autorise) return null

  const ajouter = (choisis: File[]) => {
    const retenus = choisis.filter((fichier) => estImage(fichier.name) || estArchive(fichier.name))
    const ignores = choisis.length - retenus.length
    setErreurs(
      ignores > 0
        ? [
            `${nombre(ignores, 'fichier')} ignoré(s) : formats acceptés jpg, jpeg, png, webp, gif ou zip.`,
          ]
        : [],
    )
    setFichiers((precedents) => [...precedents, ...retenus])
  }

  // Réduction dans le navigateur (canvas) des photos trop lourdes pour l'hébergement.
  const reduire = async (fichier: File): Promise<File> => {
    if (fichier.size <= POIDS_MAX) return fichier
    try {
      const image = await createImageBitmap(fichier)
      const facteur = Math.min(1, COTE_MAX / Math.max(image.width, image.height))
      const toile = document.createElement('canvas')
      toile.width = Math.max(1, Math.round(image.width * facteur))
      toile.height = Math.max(1, Math.round(image.height * facteur))
      const contexte = toile.getContext('2d')
      if (!contexte) return fichier
      contexte.drawImage(image, 0, 0, toile.width, toile.height)
      image.close()
      const blob = await new Promise<Blob | null>((resolve) =>
        toile.toBlob(resolve, 'image/jpeg', QUALITE_JPEG),
      )
      if (!blob) return fichier
      return new File([blob], `${nomSansExtension(fichier.name)}.jpg`, { type: 'image/jpeg' })
    } catch {
      return fichier
    }
  }

  const creerPhoto = async (fichier: File): Promise<number | string> => {
    const corps = new FormData()
    corps.append('file', await reduire(fichier))
    corps.append('_payload', JSON.stringify({ alt: nomSansExtension(fichier.name) }))
    const reponse = await fetch('/api/media', {
      body: corps,
      credentials: 'include',
      method: 'POST',
    })
    const donnees = (await reponse.json().catch(() => null)) as null | {
      doc?: { id: number | string }
    }
    if (!reponse.ok) throw new Error(messageErreur(donnees, `Photo « ${fichier.name} » refusée.`))
    if (!donnees?.doc?.id)
      throw new Error(`Photo « ${fichier.name} » : réponse inattendue du serveur.`)
    return donnees.doc.id
  }

  const creerEntree = async (photo: number | string, fichier: File) => {
    const reponse = await fetch('/api/galerie', {
      body: JSON.stringify({
        afficherSurSite: true,
        annee,
        categorie,
        legende: nomSansExtension(fichier.name),
        photo,
        ...(activite ? { activite } : {}),
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!reponse.ok) {
      const donnees = await reponse.json().catch(() => null)
      throw new Error(
        messageErreur(
          donnees,
          `« ${fichier.name} » : photo importée mais non ajoutée à la galerie.`,
        ),
      )
    }
  }

  const importer = async () => {
    const aImporter: File[] = []
    const problemes: string[] = []

    for (const fichier of fichiers) {
      if (!estArchive(fichier.name)) {
        aImporter.push(fichier)
        continue
      }
      try {
        const images = extraireImagesZip(new Uint8Array(await fichier.arrayBuffer()))
        if (images.length === 0)
          problemes.push(`« ${fichier.name} » : aucune image dans l’archive.`)
        images.forEach(({ nom, octets }) =>
          aImporter.push(new File([octets], nom, { type: typeMime(nom) })),
        )
      } catch {
        problemes.push(`« ${fichier.name} » : archive illisible.`)
      }
    }

    setErreurs(problemes)
    setAvancement(aImporter.length > 0 ? { faits: 0, total: aImporter.length } : null)
    setFichiers([])

    let reussies = 0
    for (const [index, fichier] of aImporter.entries()) {
      try {
        await creerEntree(await creerPhoto(fichier), fichier)
        reussies += 1
      } catch (erreur) {
        problemes.push(
          erreur instanceof Error ? erreur.message : `« ${fichier.name} » : import impossible.`,
        )
      }
      setErreurs([...problemes])
      setAvancement({ faits: index + 1, total: aImporter.length })
    }

    if (reussies > 0) {
      toast.success(`${nombre(reussies, 'photo')} ajoutée${reussies > 1 ? 's' : ''} à la galerie.`)
      router.refresh()
    } else if (aImporter.length > 0) {
      toast.error('Aucune photo importée.')
    }
  }

  return (
    <div style={{ margin: '0 0 1rem' }}>
      <div
        onDragLeave={() => setSurvol(false)}
        onDragOver={(evenement) => {
          evenement.preventDefault()
          setSurvol(true)
        }}
        onDrop={(evenement) => {
          evenement.preventDefault()
          setSurvol(false)
          ajouter([...(evenement.dataTransfer?.files ?? [])])
        }}
        style={{
          border: `1px dashed ${survol ? 'var(--theme-elevation-500)' : 'var(--theme-elevation-150)'}`,
          borderRadius: 4,
          padding: '0.75rem',
        }}
      >
        <strong>Importer des photos</strong>
        <p style={{ fontSize: 12, margin: '0.25rem 0 0.5rem', opacity: 0.75 }}>
          Glissez ici vos photos (jpg, png, webp, gif) ou une archive .zip, ou choisissez-les
          ci-dessous. Les images trop lourdes sont réduites automatiquement.
        </p>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label className="btn btn--style-secondary btn--size-small" style={{ cursor: 'pointer' }}>
            Choisir des fichiers
            <input
              accept="image/*,.zip"
              multiple
              onChange={(evenement) => {
                ajouter([...(evenement.target.files ?? [])])
                evenement.target.value = ''
              }}
              style={{ display: 'none' }}
              type="file"
            />
          </label>
          <span style={{ opacity: 0.75 }}>
            {fichiers.length > 0
              ? `${nombre(fichiers.length, 'fichier')} prêt(s)`
              : 'Aucun fichier choisi'}
          </span>
          {fichiers.length > 0 && (
            <button
              className="btn btn--style-secondary btn--size-small"
              onClick={() => setFichiers([])}
              type="button"
            >
              Vider la sélection
            </button>
          )}
        </div>

        <div
          style={{
            alignItems: 'flex-end',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '0.75rem',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: '0.25rem' }}>
            Année
            <input
              className="text"
              max={2100}
              min={1990}
              onChange={(evenement) => setAnnee(Number(evenement.target.value))}
              style={{ width: '6rem' }}
              type="number"
              value={annee}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: '0.25rem' }}>
            Catégorie
            <select
              className="text"
              onChange={(evenement) => setCategorie(evenement.target.value)}
              style={{ width: '12rem' }}
              value={categorie}
            >
              {CATEGORIES_GALERIE.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, gap: '0.25rem' }}>
            Activité ou thème (facultatif)
            <select
              className="text"
              onChange={(evenement) => setActivite(evenement.target.value)}
              style={{ width: '12rem' }}
              value={activite}
            >
              <option value="">—</option>
              {ACTIVITES_GALERIE.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn--style-primary btn--size-small"
            disabled={fichiers.length === 0 || enCours}
            onClick={importer}
            type="button"
          >
            {enCours ? 'Import en cours…' : 'Importer dans la galerie'}
          </button>
        </div>
      </div>

      {avancement && (
        <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <progress max={avancement.total} value={avancement.faits} />
          <span>
            {avancement.faits} / {avancement.total}
          </span>
        </div>
      )}

      {erreurs.length > 0 && (
        <ul
          style={{ color: 'var(--theme-error-500)', margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}
        >
          {erreurs.map((erreur, index) => (
            <li key={index}>{erreur}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
