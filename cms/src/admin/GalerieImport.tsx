'use client'

import { Button, SelectInput, toast, useAuth, XIcon } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

import { droits } from '../access'
import { ACTIVITES_GALERIE, CATEGORIES_GALERIE } from '../collections/Galerie'
import { formatPoids } from '../nomFichier'
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

type Props = {
  fichiersInitiaux?: File[]
  onFermer: () => void
  onImporte: () => void
}

// Import de photos dans la galerie : plusieurs images ou une archive .zip, réduites si trop lourdes.
export const GalerieImport: React.FC<Props> = ({ fichiersInitiaux, onFermer, onImporte }) => {
  const { user } = useAuth()
  const router = useRouter()
  const [annee, setAnnee] = React.useState(() => new Date().getFullYear())
  const [categorie, setCategorie] = React.useState('vie')
  const [activite, setActivite] = React.useState('')
  const [fichiers, setFichiers] = React.useState<File[]>(() =>
    (fichiersInitiaux ?? []).filter(
      (fichier) => estImage(fichier.name) || estArchive(fichier.name),
    ),
  )
  const [survol, setSurvol] = React.useState(false)
  const [avancement, setAvancement] = React.useState<null | { faits: number; total: number }>(null)
  const [erreurs, setErreurs] = React.useState<string[]>([])
  const selecteur = React.useRef<HTMLInputElement>(null)

  const enCours = avancement !== null && avancement.faits < avancement.total

  // Vignettes des images choisies, libérées dès que la sélection change.
  const apercus = React.useMemo(
    () =>
      fichiers.map((fichier) => (estArchive(fichier.name) ? null : URL.createObjectURL(fichier))),
    [fichiers],
  )
  React.useEffect(() => () => apercus.forEach((url) => url && URL.revokeObjectURL(url)), [apercus])

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
      onImporte()
    } else if (aImporter.length > 0) {
      toast.error('Aucune photo importée.')
    }
  }

  const vider = () => setFichiers([])
  const retirer = (index: number) =>
    setFichiers((precedents) => precedents.filter((_, position) => position !== index))
  const nbImages = fichiers.filter((fichier) => !estArchive(fichier.name)).length
  const nbArchives = fichiers.length - nbImages
  const libelleImport =
    nbArchives > 0
      ? `Importer ${nombre(fichiers.length, 'fichier')}`
      : `Importer ${nombre(fichiers.length, 'photo')}`

  return (
    <section aria-label="Importer des photos" className="cbrs-import">
      <div className="cbrs-import__entete">
        <h3>Importer des photos</h3>
        <button aria-label="Fermer l’import" onClick={onFermer} title="Fermer" type="button">
          <XIcon />
        </button>
      </div>

      <div
        className={`cbrs-import__zone${survol ? ' cbrs-import__zone--survol' : ''}`}
        onClick={() => selecteur.current?.click()}
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
        onKeyDown={(evenement) => {
          if (evenement.key === 'Enter' || evenement.key === ' ') {
            evenement.preventDefault()
            selecteur.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
      >
        <IconeImport />
        <strong>Glissez vos photos ou une archive .zip ici</strong>
        <span>
          ou <u>parcourez vos fichiers</u>
        </span>
        <span>
          JPG, PNG, WebP, GIF ou ZIP · les photos de plus de 4 Mo sont réduites automatiquement
        </span>
        <input
          accept="image/*,.zip"
          hidden
          multiple
          onChange={(evenement) => {
            ajouter([...(evenement.target.files ?? [])])
            evenement.target.value = ''
          }}
          ref={selecteur}
          type="file"
        />
      </div>

      {fichiers.length > 0 && (
        <>
          <ul className="cbrs-import__fichiers">
            {fichiers.map((fichier, index) => (
              <li className="cbrs-import__fichier" key={`${fichier.name}-${index}`}>
                {apercus[index] ? (
                  <img alt="" src={apercus[index]} />
                ) : (
                  <span className="cbrs-import__archive">ZIP</span>
                )}
                <div>
                  <span title={fichier.name}>{nomSansExtension(fichier.name)}</span>
                  <span>{formatPoids(fichier.size)}</span>
                </div>
                <button
                  aria-label={`Retirer ${fichier.name}`}
                  onClick={() => retirer(index)}
                  title="Retirer"
                  type="button"
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
          <div className="cbrs-import__resume">
            <span>
              {nbImages > 0 && nombre(nbImages, 'photo')}
              {nbImages > 0 && nbArchives > 0 && ' et '}
              {nbArchives > 0 && nombre(nbArchives, 'archive')} sélectionnée
              {fichiers.length > 1 ? 's' : ''}
            </span>
            <button onClick={vider} type="button">
              Tout retirer
            </button>
          </div>
        </>
      )}

      <div className="cbrs-import__classement">
        <p>Les photos importées seront classées ainsi (modifiable ensuite, photo par photo).</p>
        <div className="cbrs-import__champs">
          <div className="field-type cbrs-import__annee">
            <label className="field-label" htmlFor="cbrs-import-annee">
              Année
            </label>
            <input
              id="cbrs-import-annee"
              max={2100}
              min={1990}
              onChange={(evenement) => setAnnee(Number(evenement.target.value))}
              type="number"
              value={annee}
            />
          </div>
          <SelectInput
            isClearable={false}
            label="Catégorie"
            name="cbrs-import-categorie"
            onChange={(option) => {
              if (option && !Array.isArray(option)) setCategorie(String(option.value))
            }}
            options={[...CATEGORIES_GALERIE]}
            path="cbrs-import-categorie"
            value={categorie}
          />
          <SelectInput
            isClearable
            label="Activité ou thème (facultatif)"
            name="cbrs-import-activite"
            onChange={(option) =>
              setActivite(option && !Array.isArray(option) ? String(option.value) : '')
            }
            options={[...ACTIVITES_GALERIE]}
            path="cbrs-import-activite"
            placeholder="Aucune"
            value={activite}
          />
        </div>
      </div>

      {erreurs.length > 0 && (
        <ul className="cbrs-import__erreurs" role="alert">
          {erreurs.map((erreur, index) => (
            <li key={index}>{erreur}</li>
          ))}
        </ul>
      )}

      <div className="cbrs-import__pied">
        {avancement && (
          <div aria-live="polite" className="cbrs-import__progression">
            <span>
              {enCours
                ? `Import en cours : ${avancement.faits} / ${avancement.total}`
                : `Import terminé : ${avancement.faits} / ${avancement.total}`}
            </span>
            <div className="cbrs-import__jauge">
              <div style={{ width: `${(avancement.faits / avancement.total) * 100}%` }} />
            </div>
          </div>
        )}
        <Button
          buttonStyle="secondary"
          disabled={enCours}
          margin={false}
          onClick={onFermer}
          size="medium"
        >
          Fermer
        </Button>
        <Button
          buttonStyle="primary"
          disabled={fichiers.length === 0 || enCours}
          margin={false}
          onClick={importer}
          size="medium"
        >
          {enCours ? 'Import en cours…' : fichiers.length > 0 ? libelleImport : 'Importer'}
        </Button>
      </div>
    </section>
  )
}

// Pictogramme d'envoi (nuage et flèche), dans le trait des icônes Payload.
const IconeImport: React.FC = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
    <path
      d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5M12 12v8m0-8-3 3m3-3 3 3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)
