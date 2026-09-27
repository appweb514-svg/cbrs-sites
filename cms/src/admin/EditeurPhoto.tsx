'use client'

import { Button, toast, useAuth, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'
import { createPortal } from 'react-dom'

import { droits } from '../access'
import { POLICES } from '../globals/Apparence'
import { nomAffiche, separerNom } from '../nomFichier'
import {
  bornerCadre,
  type Cadre,
  cadreRecadrage,
  CONTOURS,
  couleurContour,
  dimensionsAvecContour,
  FILTRES,
  filtreCss,
  OPTIONS_DEFAUT,
  pointInteret,
  POSITIONS_TEXTE,
  positionTexte,
  RATIOS,
  type OptionsRetouche,
} from '../retouche'

type DonneesPhoto = {
  alt?: null | string
  filename?: null | string
  focalX?: null | number
  focalY?: null | number
  mimeType?: null | string
  url?: null | string
}

type Onglet = 'contours' | 'filtres' | 'point-interet' | 'recadrer' | 'texte'
type Poignee = 'e' | 'n' | 'ne' | 'nw' | 's' | 'se' | 'sw' | 'w'

// Flèches de la grille des 9 positions (même ordre que POSITIONS_TEXTE).
const FLECHES = ['↖', '↑', '↗', '←', '•', '→', '↙', '↓', '↘']

// Poignées du cadre de recadrage, en pourcentage du cadre.
const POIGNEES: { curseur: string; nom: Poignee; x: number; y: number }[] = [
  { curseur: 'nwse-resize', nom: 'nw', x: 0, y: 0 },
  { curseur: 'ns-resize', nom: 'n', x: 50, y: 0 },
  { curseur: 'nesw-resize', nom: 'ne', x: 100, y: 0 },
  { curseur: 'ew-resize', nom: 'w', x: 0, y: 50 },
  { curseur: 'ew-resize', nom: 'e', x: 100, y: 50 },
  { curseur: 'nesw-resize', nom: 'sw', x: 0, y: 100 },
  { curseur: 'ns-resize', nom: 's', x: 50, y: 100 },
  { curseur: 'nwse-resize', nom: 'se', x: 100, y: 100 },
]

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

// Dessine la photo retouchée dans un canvas : la portion recadrée, les filtres, le vignettage,
// le contour puis le texte. `echelle` adapte les mesures en pixels de la photo à un aperçu réduit.
const dessiner = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: OptionsRetouche,
  cadre: Cadre,
  echelle: number,
) => {
  const largeur = Math.max(1, Math.round(cadre.largeur * echelle))
  const hauteur = Math.max(1, Math.round(cadre.hauteur * echelle))
  const sortie = dimensionsAvecContour(largeur, hauteur, {
    epaisseur: options.epaisseurContour * echelle,
    type: options.contour,
  })
  canvas.width = sortie.largeur
  canvas.height = sortie.hauteur
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, sortie.largeur, sortie.hauteur)
  const fond = couleurContour(options)
  if (fond) {
    ctx.fillStyle = fond
    ctx.fillRect(0, 0, sortie.largeur, sortie.hauteur)
  }

  const rayon = Math.min(
    (options.coinsArrondis / 100) * Math.min(largeur, hauteur),
    Math.min(largeur, hauteur) / 2,
  )
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(sortie.decalage, sortie.decalage, largeur, hauteur, rayon)
  ctx.clip()
  ctx.filter = filtreCss(options)
  ctx.drawImage(
    image,
    cadre.x,
    cadre.y,
    cadre.largeur,
    cadre.hauteur,
    sortie.decalage,
    sortie.decalage,
    largeur,
    hauteur,
  )
  ctx.filter = 'none'
  if (options.vignettage) {
    const centreX = sortie.decalage + largeur / 2
    const centreY = sortie.decalage + hauteur / 2
    const rayonMax = Math.hypot(largeur, hauteur) / 2
    const degrade = ctx.createRadialGradient(
      centreX,
      centreY,
      rayonMax * 0.45,
      centreX,
      centreY,
      rayonMax,
    )
    degrade.addColorStop(0, 'rgba(0, 0, 0, 0)')
    degrade.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
    ctx.fillStyle = degrade
    ctx.fillRect(sortie.decalage, sortie.decalage, largeur, hauteur)
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
  ctx.fillText(texte, x + sortie.decalage, y + sortie.decalage)
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

const Choix = <T extends null | number | string>({
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
  <fieldset style={{ border: 0, margin: '1rem 0 0', minWidth: 0, padding: 0 }}>
    <legend style={{ fontSize: 13, marginBottom: '0.4rem' }}>{label}</legend>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((option) => (
        <button
          aria-pressed={valeur === option.value}
          className={`cbrs-bouton btn btn--size-small ${valeur === option.value ? 'btn--style-primary' : 'btn--style-secondary'}`}
          key={String(option.value)}
          onClick={() => changer(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
)

// Redimensionnement du cadre : les bords tirés bougent, le format choisi est conservé.
const redimensionner = (
  cadre: Cadre,
  poignee: Poignee,
  dx: number,
  dy: number,
  ratio: null | number,
  largeur: number,
  hauteur: number,
): Cadre => {
  const minimum = Math.max(24, Math.round(Math.min(largeur, hauteur) * 0.05))
  const ouest = poignee.includes('w')
  const est = poignee.includes('e')
  const nord = poignee.includes('n')
  const sud = poignee.includes('s')
  let largeurCadre = cadre.largeur
  let hauteurCadre = cadre.hauteur
  if (est) largeurCadre += dx
  if (ouest) largeurCadre -= dx
  if (sud) hauteurCadre += dy
  if (nord) hauteurCadre -= dy
  if (ratio) {
    if (est || ouest) hauteurCadre = largeurCadre / ratio
    else largeurCadre = hauteurCadre * ratio
    largeurCadre = Math.min(
      Math.max(minimum, largeurCadre),
      Math.max(minimum, Math.min(largeur, hauteur * ratio)),
    )
    hauteurCadre = largeurCadre / ratio
  } else {
    largeurCadre = Math.min(Math.max(minimum, largeurCadre), largeur)
    hauteurCadre = Math.min(Math.max(minimum, hauteurCadre), hauteur)
  }
  return bornerCadre(
    {
      hauteur: hauteurCadre,
      largeur: largeurCadre,
      x: ouest ? cadre.x + cadre.largeur - largeurCadre : cadre.x,
      y: nord ? cadre.y + cadre.hauteur - hauteurCadre : cadre.y,
    },
    largeur,
    hauteur,
  )
}

// Déplacement ou redimensionnement du cadre en cours, avec les repères écran de départ.
type Glisser = {
  cadre: Cadre
  departX: number
  departY: number
  echelleX: number
  echelleY: number
  poignee: null | Poignee
}

// Fenêtre plein écran : aperçu du canvas à gauche, onglets de réglages à droite.
const Fenetre: React.FC<{
  alt: string
  fermer: () => void
  focalX: number
  focalY: number
  id: number | string
  mimeType: string
  nom: string
  recharger: () => void
  url: string
}> = ({
  alt,
  fermer,
  focalX: focalXInitial,
  focalY: focalYInitial,
  id,
  mimeType,
  nom,
  recharger,
  url,
}) => {
  const [options, setOptions] = React.useState<OptionsRetouche>(OPTIONS_DEFAUT)
  const [onglet, setOnglet] = React.useState<Onglet>('filtres')
  const [image, setImage] = React.useState<HTMLImageElement | null>(null)
  const [cadreChoisi, setCadreChoisi] = React.useState<Cadre | null>(null)
  const [ratio, setRatio] = React.useState<null | number>(null)
  const [focalX, setFocalX] = React.useState(focalXInitial)
  const [focalY, setFocalY] = React.useState(focalYInitial)
  const [glisser, setGlisser] = React.useState<Glisser | null>(null)
  const [occupe, setOccupe] = React.useState(false)
  const toile = React.useRef<HTMLCanvasElement>(null)
  const zone = React.useRef<HTMLDivElement>(null)

  const maj = (partiel: Partial<OptionsRetouche>) =>
    setOptions((actuelles) => ({ ...actuelles, ...partiel }))

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

  // Cadre appliqué : celui de l'onglet « Recadrer » montre toute la photo, sinon le résultat.
  const cadrePhoto = React.useMemo(() => {
    if (!image) return null
    return cadreChoisi ?? cadreRecadrage(image.naturalWidth, image.naturalHeight, ratio)
  }, [cadreChoisi, image, ratio])

  const cadreAffiche = React.useMemo(() => {
    if (!image || !cadrePhoto) return null
    if (onglet === 'recadrer') return cadreRecadrage(image.naturalWidth, image.naturalHeight, null)
    return cadrePhoto
  }, [cadrePhoto, image, onglet])

  const echelle = React.useMemo(() => {
    if (!cadreAffiche?.largeur || !cadreAffiche.hauteur) return 1
    return Math.min(1, 1000 / cadreAffiche.largeur, 700 / cadreAffiche.hauteur)
  }, [cadreAffiche])

  React.useEffect(() => {
    let actif = true
    const dessinerApercu = async () => {
      await chargerPolice(options.police)
      if (!actif || !toile.current || !image || !cadreAffiche) return
      dessiner(toile.current, image, options, cadreAffiche, echelle)
    }
    dessinerApercu()
    return () => {
      actif = false
    }
  }, [cadreAffiche, echelle, image, options])

  // Suit la souris pendant un déplacement ou un redimensionnement du cadre.
  React.useEffect(() => {
    if (!glisser || !image) return
    const largeur = image.naturalWidth
    const hauteur = image.naturalHeight
    const bouger = (evenement: MouseEvent) => {
      const dx = (evenement.clientX - glisser.departX) * glisser.echelleX
      const dy = (evenement.clientY - glisser.departY) * glisser.echelleY
      if (!glisser.poignee) {
        setCadreChoisi(
          bornerCadre(
            { ...glisser.cadre, x: glisser.cadre.x + dx, y: glisser.cadre.y + dy },
            largeur,
            hauteur,
          ),
        )
        return
      }
      setCadreChoisi(
        redimensionner(glisser.cadre, glisser.poignee, dx, dy, ratio, largeur, hauteur),
      )
    }
    const relacher = () => setGlisser(null)
    window.addEventListener('mousemove', bouger)
    window.addEventListener('mouseup', relacher)
    return () => {
      window.removeEventListener('mousemove', bouger)
      window.removeEventListener('mouseup', relacher)
    }
  }, [glisser, image, ratio])

  const commencerGlisser = (evenement: React.MouseEvent, poignee: null | Poignee) => {
    if (!cadrePhoto || !zone.current) return
    evenement.preventDefault()
    evenement.stopPropagation()
    const rect = zone.current.getBoundingClientRect()
    if (!rect.width || !rect.height || !image) return
    setGlisser({
      cadre: cadrePhoto,
      departX: evenement.clientX,
      departY: evenement.clientY,
      echelleX: image.naturalWidth / rect.width,
      echelleY: image.naturalHeight / rect.height,
      poignee,
    })
  }

  const changerRatio = (nouveau: null | number) => {
    if (!image) return
    setRatio(nouveau)
    setCadreChoisi(cadreRecadrage(image.naturalWidth, image.naturalHeight, nouveau))
  }

  const placerPoint = (evenement: React.MouseEvent<HTMLDivElement>) => {
    if (!image || !cadrePhoto) return
    const rect = evenement.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const point = pointInteret(
      ((evenement.clientX - rect.left) / rect.width) * cadrePhoto.largeur + cadrePhoto.x,
      ((evenement.clientY - rect.top) / rect.height) * cadrePhoto.hauteur + cadrePhoto.y,
      image.naturalWidth,
      image.naturalHeight,
    )
    setFocalX(point.focalX)
    setFocalY(point.focalY)
  }

  // Export au format d'origine : la photo remplacée ou copiée garde sa qualité.
  const exporter = async (): Promise<Blob | null> => {
    if (!image || !cadrePhoto) return null
    const toileExport = document.createElement('canvas')
    dessiner(toileExport, image, options, cadrePhoto, 1)
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
      const donnees = (await reponse.json().catch(() => ({}))) as {
        error?: string
        errors?: { message?: string }[]
      }
      if (!reponse.ok) {
        toast.error(donnees.errors?.[0]?.message ?? donnees.error ?? 'Enregistrement impossible.')
        return
      }
      toast.success(message)
      fermer()
      // Le formulaire garde l'ancien fichier : on recharge la fiche pour repartir des données
      // enregistrées (sinon un enregistrement suivant renverrait l'ancien nom).
      recharger()
    } catch {
      toast.error('Enregistrement impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  const { base, extension } = separerNom(nom)
  const type = typeExport(mimeType)
  const nomCopie = `${base}-retouche${extensionSortie(extension, type)}`

  // Repère du point d'intérêt, ramené dans la portion affichée.
  const repere = React.useMemo(() => {
    if (!image || !cadrePhoto?.largeur || !cadrePhoto.hauteur) return null
    const pourcent = (valeur: number, origine: number, taille: number) =>
      Math.min(100, Math.max(0, ((valeur - origine) / taille) * 100))
    return {
      gauche: pourcent((focalX / 100) * image.naturalWidth, cadrePhoto.x, cadrePhoto.largeur),
      haut: pourcent((focalY / 100) * image.naturalHeight, cadrePhoto.y, cadrePhoto.hauteur),
    }
  }, [cadrePhoto, focalX, focalY, image])

  const sortie = cadreAffiche
    ? dimensionsAvecContour(
        Math.max(1, Math.round(cadreAffiche.largeur * echelle)),
        Math.max(1, Math.round(cadreAffiche.hauteur * echelle)),
        { epaisseur: options.epaisseurContour * echelle, type: options.contour },
      )
    : null

  return (
    <div
      aria-label="Modification de l’image"
      aria-modal="true"
      role="dialog"
      style={{
        background: 'var(--theme-bg)',
        display: 'flex',
        flexDirection: 'column',
        inset: 0,
        padding: '1rem',
        position: 'fixed',
        zIndex: 10000,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Modifier l’image</h3>
        <span style={{ opacity: 0.7 }}>{nomAffiche(nom)}</span>
        <span style={{ flex: 1 }} />
        <button
          className="cbrs-bouton btn btn--style-secondary"
          disabled={occupe}
          onClick={fermer}
          type="button"
        >
          Annuler
        </button>
        <button
          className="cbrs-bouton btn btn--style-secondary"
          disabled={occupe || !image}
          onClick={() =>
            envoyer(
              nomCopie,
              '/api/media',
              'POST',
              { alt, focalX, focalY },
              `Copie enregistrée : ${nomAffiche(nomCopie)}`,
            )
          }
          type="button"
        >
          Enregistrer une copie
        </button>
        <button
          className="cbrs-bouton btn btn--style-primary"
          disabled={occupe || !image}
          onClick={() =>
            envoyer(nom, `/api/media/${id}`, 'PATCH', { focalX, focalY }, 'Photo remplacée.')
          }
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
          {image && cadreAffiche && sortie ? (
            <div
              style={{
                maxWidth: '100%',
                position: 'relative',
                width: sortie.largeur,
              }}
            >
              <canvas
                ref={toile}
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                  display: 'block',
                  height: 'auto',
                  width: '100%',
                }}
              />
              <div
                ref={zone}
                style={{
                  height: `${((sortie.hauteur - sortie.decalage * 2) / sortie.hauteur) * 100}%`,
                  left: `${(sortie.decalage * 100) / sortie.largeur}%`,
                  position: 'absolute',
                  top: `${(sortie.decalage * 100) / sortie.hauteur}%`,
                  width: `${((sortie.largeur - sortie.decalage * 2) / sortie.largeur) * 100}%`,
                }}
              >
                {onglet === 'recadrer' && cadrePhoto && (
                  <>
                    <div
                      onMouseDown={(evenement) => commencerGlisser(evenement, null)}
                      style={{
                        border: '1px solid #fff',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                        boxSizing: 'border-box',
                        cursor: 'move',
                        height: `${(cadrePhoto.hauteur / image.naturalHeight) * 100}%`,
                        left: `${(cadrePhoto.x / image.naturalWidth) * 100}%`,
                        position: 'absolute',
                        top: `${(cadrePhoto.y / image.naturalHeight) * 100}%`,
                        width: `${(cadrePhoto.largeur / image.naturalWidth) * 100}%`,
                      }}
                    >
                      {POIGNEES.map((poignee) => (
                        <div
                          key={poignee.nom}
                          onMouseDown={(evenement) => commencerGlisser(evenement, poignee.nom)}
                          style={{
                            background: '#fff',
                            border: '1px solid #111',
                            borderRadius: 2,
                            cursor: poignee.curseur,
                            height: 12,
                            left: `${poignee.x}%`,
                            margin: '-6px 0 0 -6px',
                            position: 'absolute',
                            top: `${poignee.y}%`,
                            width: 12,
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
                {onglet === 'point-interet' && repere && (
                  <div
                    onClick={placerPoint}
                    style={{
                      cursor: 'crosshair',
                      height: '100%',
                      left: 0,
                      position: 'absolute',
                      top: 0,
                      width: '100%',
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '2px solid #111',
                        borderRadius: '50%',
                        height: 18,
                        left: `calc(${repere.gauche}% - 9px)`,
                        pointerEvents: 'none',
                        position: 'absolute',
                        top: `calc(${repere.haut}% - 9px)`,
                        width: 18,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ opacity: 0.7 }}>Chargement de la photo…</p>
          )}
        </div>

        <div
          style={{
            borderLeft: '1px solid var(--theme-elevation-100)',
            overflowY: 'auto',
            paddingLeft: '1rem',
            width: 340,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(
              [
                { label: 'Recadrer', value: 'recadrer' },
                { label: 'Point d’intérêt', value: 'point-interet' },
                { label: 'Filtres', value: 'filtres' },
                { label: 'Texte', value: 'texte' },
                { label: 'Contours', value: 'contours' },
              ] as const
            ).map((choix) => (
              <button
                aria-pressed={onglet === choix.value}
                className={`cbrs-bouton btn btn--size-small ${onglet === choix.value ? 'btn--style-primary' : 'btn--style-secondary'}`}
                key={choix.value}
                onClick={() => setOnglet(choix.value)}
                type="button"
              >
                {choix.label}
              </button>
            ))}
          </div>

          {onglet === 'recadrer' && (
            <>
              <Choix changer={changerRatio} label="Format" options={RATIOS} valeur={ratio} />
              <p style={{ fontSize: 12, marginTop: '0.6rem', opacity: 0.7 }}>
                Déplacez le cadre ou tirez ses poignées : le recadrage s’applique avant les filtres,
                le texte et les contours.
              </p>
              <button
                className="cbrs-bouton btn btn--style-secondary btn--size-small"
                disabled={!image}
                onClick={() => changerRatio(ratio)}
                style={{ marginTop: '0.6rem' }}
                type="button"
              >
                Réinitialiser
              </button>
            </>
          )}

          {onglet === 'point-interet' && (
            <>
              <p style={{ fontSize: 13, marginTop: '1rem' }}>
                Cliquez sur la photo : ce point reste au centre des vignettes du site.
              </p>
              <p style={{ fontSize: 12, marginTop: '0.4rem', opacity: 0.7 }}>
                Position : {focalX} % / {focalY} %
              </p>
            </>
          )}

          {onglet === 'filtres' && (
            <>
              <Choix
                changer={(filtre) => maj({ filtre })}
                label="Filtre"
                options={FILTRES}
                valeur={options.filtre}
              />
              <Curseur
                changer={(luminosite) => maj({ luminosite })}
                label="Luminosité"
                max={100}
                min={-100}
                valeur={options.luminosite}
              />
              <Curseur
                changer={(contraste) => maj({ contraste })}
                label="Contraste"
                max={100}
                min={-100}
                valeur={options.contraste}
              />
              <Curseur
                changer={(saturation) => maj({ saturation })}
                label="Saturation"
                max={100}
                min={-100}
                valeur={options.saturation}
              />
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
              <Curseur
                changer={(taille) => maj({ taille })}
                label="Taille"
                max={20}
                min={2}
                suffixe=" %"
                valeur={options.taille}
              />
              <label
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.9rem',
                }}
              >
                <span style={{ fontSize: 13 }}>Couleur</span>
                <input
                  aria-label="Couleur du texte"
                  onChange={(e) => maj({ couleurTexte: e.target.value })}
                  type="color"
                  value={options.couleurTexte}
                />
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
                <input
                  checked={options.gras}
                  onChange={(e) => maj({ gras: e.target.checked })}
                  type="checkbox"
                />
                <span style={{ fontSize: 13 }}>Gras</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <input
                  checked={options.ombre}
                  onChange={(e) => maj({ ombre: e.target.checked })}
                  type="checkbox"
                />
                <span style={{ fontSize: 13 }}>Ombre portée</span>
              </label>
              <fieldset style={{ border: 0, margin: '1rem 0 0', minWidth: 0, padding: 0 }}>
                <legend style={{ fontSize: 13, marginBottom: '0.4rem' }}>Position</legend>
                <div
                  style={{
                    display: 'grid',
                    gap: 6,
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    width: 150,
                  }}
                >
                  {POSITIONS_TEXTE.map((position, index) => (
                    <button
                      aria-label={position.label}
                      aria-pressed={options.position === position.value}
                      className={`cbrs-bouton btn btn--size-small ${options.position === position.value ? 'btn--style-primary' : 'btn--style-secondary'}`}
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
              <Choix
                changer={(contour) => maj({ contour })}
                label="Contour"
                options={CONTOURS}
                valeur={options.contour}
              />
              {options.contour === 'couleur' && (
                <>
                  <label
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.9rem',
                    }}
                  >
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
                <input
                  checked={options.vignettage}
                  onChange={(e) => maj({ vignettage: e.target.checked })}
                  type="checkbox"
                />
                <span style={{ fontSize: 13 }}>Vignettage doux</span>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Bouton « Modifier l'image », à la place du bouton natif de Payload (même apparence).
export const EditeurPhoto: React.FC = () => {
  const { id, savedDocumentData } = useDocumentInfo()
  const { user } = useAuth()
  const [ouvert, setOuvert] = React.useState(false)
  const fermer = React.useCallback(() => setOuvert(false), [])
  const recharger = React.useCallback(() => window.location.reload(), [])
  // La barre d'actions de la photo appartient à Payload : on la cherche pour y poser notre bouton
  // (elle peut être montée juste après ce champ, d'où la seconde tentative différée).
  const [conteneur, setConteneur] = React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    const chercher = () => {
      const barre = document.querySelector<HTMLElement>('.file-field__upload-actions')
      if (barre) setConteneur(barre)
      return Boolean(barre)
    }
    if (chercher()) return
    const attente = window.setTimeout(chercher, 500)
    return () => window.clearTimeout(attente)
  }, [])

  const donnees = savedDocumentData as DonneesPhoto | undefined
  if (!droits(user, 'media', 'modifier').autorise || !id || !donnees?.url) return null
  if (donnees.mimeType === 'image/svg+xml') return null

  const bouton = (
    <Button
      buttonStyle="pill"
      margin={false}
      onClick={() => setOuvert(true)}
      size="small"
      type="button"
    >
      Modifier l’image
    </Button>
  )

  return (
    <>
      {ouvert && (
        <Fenetre
          alt={String(donnees.alt ?? '')}
          fermer={fermer}
          focalX={typeof donnees.focalX === 'number' ? donnees.focalX : 50}
          focalY={typeof donnees.focalY === 'number' ? donnees.focalY : 50}
          id={id}
          mimeType={String(donnees.mimeType ?? '')}
          nom={String(donnees.filename ?? '')}
          recharger={recharger}
          url={donnees.url}
        />
      )}
      {conteneur ? (
        createPortal(
          <>
            {bouton}
            <span className="cbrs-editeur-photo__aide">
              Recadrage, point d’intérêt, filtres, texte et contours…
            </span>
          </>,
          conteneur,
        )
      ) : (
        <div className="field-type" style={{ marginBottom: '1.5rem' }}>
          {bouton}
          <p style={{ fontSize: 12, marginTop: '0.4rem', opacity: 0.7 }}>
            Recadrage, point d’intérêt, filtres, texte et contours…
          </p>
        </div>
      )}
    </>
  )
}
