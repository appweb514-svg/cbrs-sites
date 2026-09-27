'use client'

import React from 'react'

import { nomAffiche } from '../nomFichier'

// Nombre de photos par page : identique à la pagination de la collection Galerie.
const PAR_PAGE = 20

const STYLE_ID = 'cbrs-galerie-mosaique-style'

// En mosaïque, le tableau et la pagination natifs de Payload laissent la place à la grille.
const STYLE_MOSAIQUE = `body.cbrs-galerie-mosaique .collection-list--galerie .collection-list__tables,
body.cbrs-galerie-mosaique .collection-list--galerie .page-controls { display: none; }`

// Taille des vignettes : plus petites = plus de photos à l'écran.
const TAILLES = [
  { colonne: 120, label: 'Petites' },
  { colonne: 180, label: 'Moyennes' },
  { colonne: 280, label: 'Grandes' },
] as const

const CLE_VUE = 'cbrs-galerie-vue'
const CLE_TAILLE = 'cbrs-galerie-taille'

const lire = (cle: string): string | null => {
  try {
    return window.localStorage.getItem(cle)
  } catch {
    return null
  }
}

const ecrire = (cle: string, valeur: string) => {
  try {
    window.localStorage.setItem(cle, valeur)
  } catch {
    // Navigation privée : le choix vaut pour la visite en cours.
  }
}

type PhotoMedia = {
  filename?: null | string
  sizes?: null | { vignette?: null | { url?: null | string } }
  url?: null | string
}

type EntreeGalerie = {
  afficherSurSite?: boolean | null
  id: number | string
  legende?: null | string
  photo?: null | number | PhotoMedia | string
}

const vignetteDe = (entree: EntreeGalerie): string => {
  const photo = typeof entree.photo === 'object' && entree.photo !== null ? entree.photo : null
  return photo?.sizes?.vignette?.url || photo?.url || ''
}

// Sans légende, la vignette porte le nom du fichier, sans extension.
const nomDe = (entree: EntreeGalerie): string => {
  const photo = typeof entree.photo === 'object' && entree.photo !== null ? entree.photo : null
  return photo?.filename ? nomAffiche(photo.filename) : ''
}

// Numéros de page affichés : 1 … autour de la page courante … dernière.
const pagesAffichees = (courante: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages: (number | '…')[] = [1]
  const debut = Math.max(2, courante - 1)
  const fin = Math.min(total - 1, courante + 1)
  if (debut > 2) pages.push('…')
  for (let page = debut; page <= fin; page += 1) pages.push(page)
  if (fin < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

// Liste des photos de la galerie : au choix le tableau de Payload ou une mosaïque de vignettes.
export const GalerieVues: React.FC = () => {
  const [vue, setVue] = React.useState<'liste' | 'mosaique'>('liste')
  const [taille, setTaille] = React.useState(1)
  const [page, setPage] = React.useState(1)
  const [photos, setPhotos] = React.useState<EntreeGalerie[]>([])
  const [totalDocs, setTotalDocs] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [chargement, setChargement] = React.useState(false)
  const [erreur, setErreur] = React.useState<string | null>(null)

  // Choix de la vue et de la taille des vignettes, mémorisés d'une visite à l'autre.
  // Lu après le montage : localStorage n'existe pas au rendu serveur.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lire(CLE_VUE) === 'mosaique') setVue('mosaique')
    const enregistree = Number(lire(CLE_TAILLE))
    if (enregistree === 0 || enregistree === 1 || enregistree === 2) setTaille(enregistree)
  }, [])

  React.useEffect(() => {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = STYLE_MOSAIQUE
    document.head.append(style)
    document.body.classList.toggle('cbrs-galerie-mosaique', vue === 'mosaique')
    return () => {
      document.body.classList.remove('cbrs-galerie-mosaique')
      style.remove()
    }
  }, [vue])

  React.useEffect(() => {
    if (vue !== 'mosaique') return

    const controleur = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChargement(true)
    setErreur(null)
    fetch(`/api/galerie?depth=1&limit=${PAR_PAGE}&page=${page}&sort=_order`, {
      credentials: 'include',
      signal: controleur.signal,
    })
      .then((reponse) => reponse.json())
      .then((resultat: { docs?: EntreeGalerie[]; totalDocs?: number; totalPages?: number }) => {
        setPhotos(resultat.docs ?? [])
        setTotalDocs(resultat.totalDocs ?? 0)
        setTotalPages(resultat.totalPages || 1)
      })
      .catch(() => {
        if (!controleur.signal.aborted) setErreur('Chargement des photos impossible.')
      })
      .finally(() => {
        if (!controleur.signal.aborted) setChargement(false)
      })

    return () => controleur.abort()
  }, [page, vue])

  const changerVue = (choix: 'liste' | 'mosaique') => {
    setVue(choix)
    setPage(1)
    ecrire(CLE_VUE, choix)
  }

  const changerTaille = (choix: number) => {
    setTaille(choix)
    ecrire(CLE_TAILLE, String(choix))
  }

  return (
    <div style={{ margin: '0 0 1rem' }}>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ opacity: 0.75 }}>Affichage :</span>
        {(['liste', 'mosaique'] as const).map((choix) => (
          <button
            aria-pressed={vue === choix}
            className={`btn btn--size-small ${vue === choix ? 'btn--style-primary' : 'btn--style-secondary'}`}
            key={choix}
            onClick={() => changerVue(choix)}
            type="button"
          >
            {choix === 'liste' ? 'Liste' : 'Mosaïque'}
          </button>
        ))}
        {vue === 'mosaique' && (
          <label
            style={{ alignItems: 'center', display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}
          >
            Taille des photos
            <input
              aria-label="Taille des vignettes"
              max={TAILLES.length - 1}
              min={0}
              onChange={(evenement) => changerTaille(Number(evenement.target.value))}
              step={1}
              type="range"
              value={taille}
            />
            <span style={{ opacity: 0.75, width: '5rem' }}>{TAILLES[taille].label}</span>
          </label>
        )}
      </div>

      {vue === 'mosaique' && (
        <div style={{ marginTop: '1rem' }}>
          {erreur && <p style={{ color: 'var(--theme-error-500)' }}>{erreur}</p>}
          {!erreur && chargement && <p style={{ opacity: 0.75 }}>Chargement des photos…</p>}
          {!erreur && !chargement && photos.length === 0 && (
            <p style={{ opacity: 0.75 }}>Aucune photo dans la galerie.</p>
          )}

          <div
            style={{
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: `repeat(auto-fill, minmax(${TAILLES[taille].colonne}px, 1fr))`,
            }}
          >
            {photos.map((entree) => {
              const source = vignetteDe(entree)
              return (
                <a
                  href={`/admin/collections/galerie/${entree.id}`}
                  key={entree.id}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {source ? (
                    <img
                      alt=""
                      src={source}
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: 4,
                        display: 'block',
                        objectFit: 'cover',
                        width: '100%',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        aspectRatio: '1 / 1',
                        background: 'var(--theme-elevation-100)',
                        borderRadius: 4,
                        display: 'block',
                      }}
                    />
                  )}
                  <span
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      fontSize: 12,
                      gap: '0.35rem',
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {entree.legende || nomDe(entree) || `Photo ${entree.id}`}
                    </span>
                    <span
                      aria-label={entree.afficherSurSite ? 'Oui' : 'Non'}
                      role="img"
                      style={{
                        color: entree.afficherSurSite ? '#1a7f37' : '#c62828',
                        flex: '0 0 auto',
                        fontWeight: 'bold',
                      }}
                      title={
                        entree.afficherSurSite ? 'Affichée sur le site' : 'Masquée sur le site'
                      }
                    >
                      {entree.afficherSurSite ? '✓' : '✗'}
                    </span>
                  </span>
                </a>
              )
            })}
          </div>

          {!chargement && totalPages > 1 && (
            <nav
              aria-label="Pages de la mosaïque"
              style={{
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
                marginTop: '1rem',
              }}
            >
              <button
                className="btn btn--style-secondary btn--size-small"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                type="button"
              >
                Précédent
              </button>
              {pagesAffichees(page, totalPages).map((numero, index) =>
                numero === '…' ? (
                  <span key={`separateur-${index}`} style={{ opacity: 0.6 }}>
                    …
                  </span>
                ) : (
                  <button
                    aria-current={numero === page ? 'page' : undefined}
                    className={`btn btn--size-small ${numero === page ? 'btn--style-primary' : 'btn--style-secondary'}`}
                    key={numero}
                    onClick={() => setPage(numero)}
                    type="button"
                  >
                    {numero}
                  </button>
                ),
              )}
              <button
                className="btn btn--style-secondary btn--size-small"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                type="button"
              >
                Suivant
              </button>
              <span style={{ marginLeft: 'auto', opacity: 0.75 }}>
                {totalDocs} photo{totalDocs > 1 ? 's' : ''}
              </span>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
