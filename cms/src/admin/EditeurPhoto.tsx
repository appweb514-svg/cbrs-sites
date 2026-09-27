'use client'

import { toast, useAuth, useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

import { droits } from '../access'
import { POLICES } from '../globals/Apparence'
import { nomAffiche, separerNom } from '../nomFichier'
import {
  CONTOURS,
  couleurContour,
  dimensionsAvecContour,
  FILTRES,
  filtreCss,
  OPTIONS_DEFAUT,
  POSITIONS_TEXTE,
  positionTexte,
  type OptionsRetouche,
} from '../retouche'

type DonneesPhoto = {
  alt?: null | string
  filename?: null | string
  mimeType?: null | string
  url?: null | string
}

// Flèches de la grille des 9 positions (même ordre que POSITIONS_TEXTE).
const FLECHES = ['↖', '↑', '↗', '←', '•', '→', '↙', '↓', '↘']

// Format d'export : celui d'origine, JPEG 0,9 quand il est inconnu.
const typeExport = (mime?: null | string): string =>
  mime === 'image/png' || mime === 'image/webp' ? mime : 'image/jpeg'

const extensionSortie = (extension: string, type: string): string => {
  if (extension) return extension
  if (type === 'image/png') return '.png'
  if (type === 'image/webp') return '.webp'
  return '.jpg'
}

const famillePolice = (police: string): string =>
  police === 'defaut' ? 'system-ui, sans-serif' : `"${police}", system-ui, sans-serif`

// Charge la police choisie depuis Google Fonts (comme le site), une seule fois par police.
const chargerPolice = async (police: string): Promise<void> => {
  if (police === 'defaut' || typeof document === 'undefined') return
  const id = `police-retouche-${police.replace(/[^a-zA-Z0-9]+/g, '-')}`
  if (!document.getElementById(id)) {
    const lien = document.createElement('link')
    lien.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(police)}:wght@400;700&display=swap`
    lien.id = id
    lien.rel = 'stylesheet'
    document.head.appendChild(lien)
  }
  try {
    await document.fonts.load(`16px "${police}"`)
  } catch {
    // Police indisponible : le navigateur dessine avec sa police de secours.
  }
}

// Dessine la photo retouchée dans un canvas : cadre, image filtrée, vignettage puis texte.
// `echelle` adapte les mesures en pixels de la photo (épaisseur saisie) à l'aperçu réduit.
const dessiner = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: OptionsRetouche,
  largeur: number,
  hauteur: number,
  echelle: number,
) => {
  const cadre = dimensionsAvecContour(largeur, hauteur, {
    epaisseur: options.epaisseurContour * echelle,
    type: options.contour,
  })
  canvas.width = cadre.largeur
  canvas.height = cadre.hauteur
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, cadre.largeur, cadre.hauteur)
  const fond = couleurContour(options)
  if (fond) {
    ctx.fillStyle = fond
    ctx.fillRect(0, 0, cadre.largeur, cadre.hauteur)
  }

  const rayon = Math.min((options.coinsArrondis / 100) * Math.min(largeur, hauteur), Math.min(largeur, hauteur) / 2)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(cadre.decalage, cadre.decalage, largeur, hauteur, rayon)
  ctx.clip()
  ctx.filter = filtreCss(options)
  ctx.drawImage(image, cadre.decalage, cadre.decalage, largeur, hauteur)
  ctx.filter = 'none'
  if (options.vignettage) {
    const centreX = cadre.decalage + largeur / 2
    const centreY = cadre.decalage + hauteur / 2
    const rayonMax = Math.hypot(largeur, hauteur) / 2
    const degrade = ctx.createRadialGradient(centreX, centreY, rayonMax * 0.45, centreX, centreY, rayonMax)
    degrade.addColorStop(0, 'rgba(0, 0, 0, 0)')
    degrade.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
    ctx.fillStyle = degrade
    ctx.fillRect(cadre.decalage, cadre.decalage, largeur, hauteur)
  }
  ctx.restore()

  const texte = options.texte.trim()
  if (!texte) return
  const taille = Math.max(8, Math.round((options.taille / 100) * hauteur))
  const marge = Math.max(6, Math.round(Math.min(largeur, hauteur) * 0.04))
  const { x, y, align, baseline } = positionTexte(options.position, largeur, hauteur, marge)
  ctx.font = `${options.gras ? 'bold ' : ''}${taille}px ${famillePolice(options.police)}`
  ctx.fillStyle = options.couleurTexte
  ctx.textAlign = align
  ctx.textBaseline = baseline
  if (options.ombre) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = Math.round(taille * 0.25)
    ctx.shadowOffsetY = Math.max(1, Math.round(taille * 0.06))
  }
  ctx.fillText(texte, x + cadre.decalage, y + cadre.decalage)
}

const Curseur: React.FC<{
  changer: (valeur: number) => void
  label: string
  max: number
  min: number
  suffixe?: string
  valeur: number
}> = ({ changer, label, max, min, suffixe = '', valeur }) => (
  <label style={{ display: 'block', marginTop: '0.9rem' }}>
    <span style={{ fontSize: 13 }}>
      {label} : {valeur}
      {suffixe}
    </span>
    <input
      max={max}
      min={min}
      onChange={(e) => changer(Number(e.target.value))}
      style={{ display: 'block', width: '100%' }}
      type="range"
      value={valeur}
    />
  </label>
)

const Choix = <T extends string>({
  changer,
  label,
  options,
  valeur,
}: {
  changer: (valeur: T) => void
  label: string
  options: { label: string; value: T }[]
  valeur: T
}) => (
  <fieldset style={{ border: 0, margin: '0.9rem 0 0', padding: 0 }}>
    <legend style={{ fontSize: 13, marginBottom: '0.4rem' }}>{label}</legend>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((option) => (
        <button
          aria-pressed={valeur === option.value}
          className={`btn btn--size-small ${valeur === option.value ? 'btn--style-primary' : 'btn--style-secondary'}`}
          key={option.value}
          onClick={() => changer(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
)

// Fenêtre plein écran : aperçu du canvas à gauche, onglets de réglages à droite.
const Fenetre: React.FC<{
  alt: string
  fermer: () => void
  id: number | string
  mimeType: string
  nom: string
  rafraichir: () => void
  url: string
}> = ({ alt, fermer, id, mimeType, nom, rafraichir, url }) => {
  const [options, setOptions] = React.useState<OptionsRetouche>(OPTIONS_DEFAUT)
  const [onglet, setOnglet] = React.useState<'contours' | 'filtres' | 'texte'>('filtres')
  const [image, setImage] = React.useState<HTMLImageElement | null>(null)
  const [occupe, setOccupe] = React.useState(false)
  const toile = React.useRef<HTMLCanvasElement>(null)

  const maj = (partiel: Partial<OptionsRetouche>) => setOptions((actuelles) => ({ ...actuelles, ...partiel }))

  React.useEffect(() => {
    const auClavier = (evenement: KeyboardEvent) => {
      if (evenement.key === 'Escape') fermer()
    }
    window.addEventListener('keydown', auClavier)
    return () => window.removeEventListener('keydown', auClavier)
  }, [fermer])

  React.useEffect(() => {
    let actif = true
    const chargee = new Image()
    chargee.onload = () => {
      if (actif) setImage(chargee)
    }
    chargee.onerror = () => {
      if (actif) toast.error('Photo illisible : impossible de la retoucher.')
    }
    chargee.src = url
    return () => {
      actif = false
    }
  }, [url])

  React.useEffect(() => {
    let actif = true
    const dessinerApercu = async () => {
      await chargerPolice(options.police)
      if (!actif || !toile.current || !image) return
      const echelle = Math.min(1, 1000 / image.naturalWidth, 700 / image.naturalHeight)
      dessiner(
        toile.current,
        image,
        options,
        Math.round(image.naturalWidth * echelle),
        Math.round(image.naturalHeight * echelle),
        echelle,
      )
    }
    dessinerApercu()
    return () => {
      actif = false
    }
  }, [image, options])

  // Export au format d'origine : la photo remplacée ou copiée garde sa qualité.
  const exporter = async (): Promise<Blob | null> => {
    if (!image) return null
    const toileExport = document.createElement('canvas')
    dessiner(toileExport, image, options, image.naturalWidth, image.naturalHeight, 1)
    const type = typeExport(mimeType)
    return new Promise((resoudre) => {
      toileExport.toBlob((blob) => resoudre(blob), type, type === 'image/jpeg' ? 0.9 : undefined)
    })
  }

  const envoyer = async (
    nomFichier: string,
    chemin: string,
    methode: 'PATCH' | 'POST',
    charge: Record<string, unknown>,
    message: string,
  ) => {
    const blob = await exporter()
    if (!blob) {
      toast.error('Export de la photo impossible.')
      return
    }
    setOccupe(true)
    try {
      const corps = new FormData()
      corps.append('file', blob, nomFichier)
      corps.append('_payload', JSON.stringify(charge))
      const reponse = await fetch(chemin, { body: corps, credentials: 'include', method: methode })
      const donnees = (await reponse.json().catch(() => ({}))) as { error?: string; errors?: { message?: string }[] }
      if (!reponse.ok) {
        toast.error(donnees.errors?.[0]?.message ?? donnees.error ?? 'Enregistrement impossible.')
        return
      }
      toast.success(message)
      rafraichir()
      fermer()
    } catch {
      toast.error('Enregistrement impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  const { base, extension } = separerNom(nom)
  const type = typeExport(mimeType)
  const nomCopie = `${base}-retouche${extensionSortie(extension, type)}`

  return (
    <div
      aria-label="Retouche de la photo"
      aria-modal="true"
      role="dialog"
      style={{
        background: 'var(--theme-bg)',
        display: 'flex',
        flexDirection: 'column',
        inset: 0,
        padding: '1rem',
        position: 'fixed',
        zIndex: 100,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Retoucher la photo</h3>
        <span style={{ opacity: 0.7 }}>{nomAffiche(nom)}</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn--style-secondary" disabled={occupe} onClick={fermer} type="button">
          Annuler
        </button>
        <button
          className="btn btn--style-secondary"
          disabled={occupe || !image}
          onClick={() => envoyer(nomCopie, '/api/media', 'POST', { alt }, `Copie enregistrée : ${nomAffiche(nomCopie)}`)}
          type="button"
        >
          Enregistrer une copie
        </button>
        <button
          className="btn btn--style-primary"
          disabled={occupe || !image}
          onClick={() => envoyer(nom, `/api/media/${id}`, 'PATCH', {}, 'Photo remplacée.')}
          type="button"
        >
          Remplacer la photo
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0, marginTop: '1rem' }}>
        <div
          style={{
            alignItems: 'center',
            background: 'var(--theme-elevation-50)',
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            overflow: 'auto',
          }}
        >
          {image ? (
            <canvas ref={toile} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.35)', maxHeight: '72vh', maxWidth: '100%' }} />
          ) : (
            <p style={{ opacity: 0.7 }}>Chargement de la photo…</p>
          )}
        </div>

        <div style={{ borderLeft: '1px solid var(--theme-elevation-100)', overflowY: 'auto', paddingLeft: '1rem', width: 340 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                { label: 'Filtres', value: 'filtres' },
                { label: 'Texte', value: 'texte' },
                { label: 'Contours', value: 'contours' },
              ] as const
            ).map((choix) => (
              <button
                aria-pressed={onglet === choix.value}
                className={`btn btn--size-small ${onglet === choix.value ? 'btn--style-primary' : 'btn--style-secondary'}`}
                key={choix.value}
                onClick={() => setOnglet(choix.value)}
                type="button"
              >
                {choix.label}
              </button>
            ))}
          </div>

          {onglet === 'filtres' && (
            <>
              <Choix changer={(filtre) => maj({ filtre })} label="Filtre" options={FILTRES} valeur={options.filtre} />
              <Curseur changer={(luminosite) => maj({ luminosite })} label="Luminosité" max={100} min={-100} valeur={options.luminosite} />
              <Curseur changer={(contraste) => maj({ contraste })} label="Contraste" max={100} min={-100} valeur={options.contraste} />
              <Curseur changer={(saturation) => maj({ saturation })} label="Saturation" max={100} min={-100} valeur={options.saturation} />
            </>
          )}

          {onglet === 'texte' && (
            <>
              <label style={{ display: 'block', marginTop: '0.9rem' }}>
                <span style={{ fontSize: 13 }}>Texte</span>
                <input
                  className="text"
                  onChange={(e) => maj({ texte: e.target.value })}
                  placeholder="Ex. « Sortie du 12 juin »"
                  style={{ display: 'block', width: '100%' }}
                  value={options.texte}
                />
              </label>
              <label style={{ display: 'block', marginTop: '0.9rem' }}>
                <span style={{ fontSize: 13 }}>Police</span>
                <select
                  className="text"
                  onChange={(e) => maj({ police: e.target.value })}
                  style={{ display: 'block', width: '100%' }}
                  value={options.police}
                >
                  {POLICES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <Curseur changer={(taille) => maj({ taille })} label="Taille" max={20} min={2} suffixe=" %" valeur={options.taille} />
              <label style={{ alignItems: 'center', display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
                <span style={{ fontSize: 13 }}>Couleur</span>
                <input
                  aria-label="Couleur du texte"
                  onChange={(e) => maj({ couleurTexte: e.target.value })}
                  type="color"
                  value={options.couleurTexte}
                />
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
                <input checked={options.gras} onChange={(e) => maj({ gras: e.target.checked })} type="checkbox" />
                <span style={{ fontSize: 13 }}>Gras</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <input checked={options.ombre} onChange={(e) => maj({ ombre: e.target.checked })} type="checkbox" />
                <span style={{ fontSize: 13 }}>Ombre portée</span>
              </label>
              <fieldset style={{ border: 0, margin: '0.9rem 0 0', padding: 0 }}>
                <legend style={{ fontSize: 13, marginBottom: '0.4rem' }}>Position</legend>
                <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(3, 1fr)', width: 150 }}>
                  {POSITIONS_TEXTE.map((position, index) => (
                    <button
                      aria-label={position.label}
                      aria-pressed={options.position === position.value}
                      className={`btn btn--size-small ${options.position === position.value ? 'btn--style-primary' : 'btn--style-secondary'}`}
                      key={position.value}
                      onClick={() => maj({ position: position.value })}
                      title={position.label}
                      type="button"
                    >
                      {FLECHES[index]}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {onglet === 'contours' && (
            <>
              <Choix changer={(contour) => maj({ contour })} label="Contour" options={CONTOURS} valeur={options.contour} />
              {options.contour === 'couleur' && (
                <>
                  <label style={{ alignItems: 'center', display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
                    <span style={{ fontSize: 13 }}>Couleur du contour</span>
                    <input
                      aria-label="Couleur du contour"
                      onChange={(e) => maj({ couleurContour: e.target.value })}
                      type="color"
                      value={options.couleurContour}
                    />
                  </label>
                  <Curseur
                    changer={(epaisseurContour) => maj({ epaisseurContour })}
                    label="Épaisseur du contour"
                    max={80}
                    min={0}
                    suffixe=" px"
                    valeur={options.epaisseurContour}
                  />
                </>
              )}
              <Curseur
                changer={(coinsArrondis) => maj({ coinsArrondis })}
                label="Coins arrondis"
                max={20}
                min={0}
                suffixe=" %"
                valeur={options.coinsArrondis}
              />
              <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
                <input checked={options.vignettage} onChange={(e) => maj({ vignettage: e.target.checked })} type="checkbox" />
                <span style={{ fontSize: 13 }}>Vignettage doux</span>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Bouton « Retoucher la photo » : ouvre la fenêtre de retouche (filtres, texte, contours).
export const EditeurPhoto: React.FC = () => {
  const { id, savedDocumentData } = useDocumentInfo()
  const { user } = useAuth()
  const routeur = useRouter()
  const [ouvert, setOuvert] = React.useState(false)
  const fermer = React.useCallback(() => setOuvert(false), [])
  const rafraichir = React.useCallback(() => routeur.refresh(), [routeur])

  const donnees = savedDocumentData as DonneesPhoto | undefined
  if (!droits(user, 'media', 'modifier').autorise || !id || !donnees?.url) return null
  if (donnees.mimeType === 'image/svg+xml') return null

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      {ouvert && (
        <Fenetre
          alt={String(donnees.alt ?? '')}
          fermer={fermer}
          id={id}
          mimeType={String(donnees.mimeType ?? '')}
          nom={String(donnees.filename ?? '')}
          rafraichir={rafraichir}
          url={donnees.url}
        />
      )}
      <button className="btn btn--style-secondary" onClick={() => setOuvert(true)} type="button">
        Retoucher la photo
      </button>
      <p style={{ marginTop: '0.4rem', opacity: 0.7, fontSize: 12 }}>
        Filtres, texte et contours. La photo d’origine n’est modifiée qu’en cliquant sur « Remplacer la photo ».
      </p>
    </div>
  )
}
