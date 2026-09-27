'use client'

import {
  Button,
  GridViewIcon,
  ListViewIcon,
  Pagination,
  PlusIcon,
  Spinner,
  useAuth,
} from '@payloadcms/ui'
import React from 'react'

import { droits } from '../access'
import { nomAffiche } from '../nomFichier'
import { GalerieImport } from './GalerieImport'

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

const contientFichiers = (evenement: DragEvent) =>
  Array.from(evenement.dataTransfer?.types ?? []).includes('Files')

// Barre de la galerie : choix de la vue (tableau de Payload ou mosaïque) et import de photos.
export const GalerieVues: React.FC = () => {
  const { user } = useAuth()
  const peutImporter = droits(user, 'galerie', 'creer').autorise
  const [vue, setVue] = React.useState<'liste' | 'mosaique'>('liste')
  const [taille, setTaille] = React.useState(1)
  const [page, setPage] = React.useState(1)
  const [photos, setPhotos] = React.useState<EntreeGalerie[]>([])
  const [totalDocs, setTotalDocs] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [chargement, setChargement] = React.useState(false)
  const [erreur, setErreur] = React.useState<string | null>(null)
  const [version, setVersion] = React.useState(0)
  const [import_, setImport] = React.useState<null | { fichiers: File[]; cle: number }>(null)

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

  // Des photos glissées n'importe où sur la page ouvrent l'import avec ces fichiers.
  React.useEffect(() => {
    if (!peutImporter) return
    const survoler = (evenement: DragEvent) => {
      if (contientFichiers(evenement)) evenement.preventDefault()
    }
    const deposer = (evenement: DragEvent) => {
      if (!contientFichiers(evenement) || evenement.defaultPrevented) return
      evenement.preventDefault()
      const fichiers = [...(evenement.dataTransfer?.files ?? [])]
      setImport((actuel) => actuel ?? { cle: Date.now(), fichiers })
    }
    window.addEventListener('dragover', survoler)
    window.addEventListener('drop', deposer)
    return () => {
      window.removeEventListener('dragover', survoler)
      window.removeEventListener('drop', deposer)
    }
  }, [peutImporter])

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
  }, [page, vue, version])

  const changerVue = (choix: 'liste' | 'mosaique') => {
    setVue(choix)
    setPage(1)
    ecrire(CLE_VUE, choix)
  }

  const changerTaille = (choix: number) => {
    setTaille(choix)
    ecrire(CLE_TAILLE, String(choix))
  }

  const premiere = (page - 1) * PAR_PAGE + 1
  const derniere = Math.min(page * PAR_PAGE, totalDocs)

  return (
    <div className="cbrs-gal">
      <div className="cbrs-gal__barre">
        <div aria-label="Affichage" className="cbrs-segments" role="group">
          <button aria-pressed={vue === 'liste'} onClick={() => changerVue('liste')} type="button">
            <ListViewIcon />
            Liste
          </button>
          <button
            aria-pressed={vue === 'mosaique'}
            onClick={() => changerVue('mosaique')}
            type="button"
          >
            <GridViewIcon />
            Mosaïque
          </button>
        </div>

        <div className="cbrs-gal__barre-droite">
          {vue === 'mosaique' && (
            <div aria-label="Taille des photos" className="cbrs-segments" role="group">
              {TAILLES.map(({ label }, index) => (
                <button
                  aria-pressed={taille === index}
                  key={label}
                  onClick={() => changerTaille(index)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {peutImporter && !import_ && (
            <Button
              buttonStyle="primary"
              icon={<PlusIcon />}
              iconPosition="left"
              margin={false}
              onClick={() => setImport({ cle: Date.now(), fichiers: [] })}
              size="medium"
            >
              Importer des photos
            </Button>
          )}
        </div>
      </div>

      {import_ && (
        <GalerieImport
          fichiersInitiaux={import_.fichiers}
          key={import_.cle}
          onFermer={() => setImport(null)}
          onImporte={() => setVersion((valeur) => valeur + 1)}
        />
      )}

      {vue === 'mosaique' && (
        <div className="cbrs-mosaique">
          {erreur && <p className="cbrs-mosaique__vide">{erreur}</p>}
          {!erreur && chargement && photos.length === 0 && (
            <div className="cbrs-mosaique__vide">
              <Spinner />
            </div>
          )}
          {!erreur && !chargement && photos.length === 0 && (
            <p className="cbrs-mosaique__vide">Aucune photo dans la galerie pour l’instant.</p>
          )}

          <div
            aria-busy={chargement}
            className="cbrs-mosaique__grille"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${TAILLES[taille].colonne}px, 1fr))`,
              opacity: chargement ? 0.5 : 1,
            }}
          >
            {photos.map((entree) => {
              const source = vignetteDe(entree)
              const affichee = Boolean(entree.afficherSurSite)
              const titre = entree.legende || nomDe(entree) || `Photo ${entree.id}`
              return (
                <a
                  className="cbrs-mosaique__carte"
                  href={`/admin/collections/galerie/${entree.id}`}
                  key={entree.id}
                  title={titre}
                >
                  <span className="cbrs-mosaique__image">
                    {source && <img alt="" loading="lazy" src={source} />}
                    <span
                      aria-label={affichee ? 'Affichée sur le site' : 'Masquée sur le site'}
                      className={`cbrs-mosaique__statut cbrs-mosaique__statut--${affichee ? 'oui' : 'non'}`}
                      role="img"
                      title={affichee ? 'Affichée sur le site' : 'Masquée sur le site'}
                    >
                      {affichee ? '✓' : '✗'}
                    </span>
                  </span>
                  <span className="cbrs-mosaique__legende">{titre}</span>
                </a>
              )
            })}
          </div>

          {totalDocs > 0 && (
            <div className="cbrs-mosaique__pied">
              <Pagination
                hasNextPage={page < totalPages}
                hasPrevPage={page > 1}
                nextPage={page + 1}
                numberOfNeighbors={1}
                onChange={setPage}
                page={page}
                prevPage={page - 1}
                totalPages={totalPages}
              />
              <span className="cbrs-mosaique__compte">
                {premiere}–{derniere} sur {totalDocs} photo{totalDocs > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
