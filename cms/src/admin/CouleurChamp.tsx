'use client'

import type { TextFieldClientComponent } from 'payload'
import { FieldLabel, useField } from '@payloadcms/ui'

import { COULEURS_ORIGINE, PALETTE, contrasteAvecBlanc, lisibleAvecBlanc, type NomCouleur } from '../couleurs'

// Nuancier cliquable : évite de taper un code hexadécimal, et « Rétablir » remet la couleur d'origine.
export const CouleurChamp: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const nom = String(path.split('.').pop()) as NomCouleur
  const origine = COULEURS_ORIGINE[nom]
  const actuelle = (value || origine || '').toLowerCase()
  const estOrigine = actuelle === (origine || '').toLowerCase()

  return (
    <div className="field-type text" style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label={field?.label} path={path} required={field?.required} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: actuelle,
            border: '1px solid rgba(0,0,0,0.25)',
            flex: '0 0 auto',
          }}
        />
        <input
          aria-label={String(field?.label ?? 'Couleur')}
          className="text"
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          style={{ width: '11rem' }}
          value={value || ''}
        />
        <button
          className="btn btn--style-secondary btn--size-small"
          disabled={estOrigine}
          onClick={() => setValue(origine)}
          type="button"
        >
          Rétablir {origine}
        </button>
      </div>

      {PALETTE.map((famille) => (
        <div key={famille.famille} style={{ marginTop: '0.6rem' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{famille.famille}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {famille.teintes.map((teinte) => (
              <button
                aria-label={`${famille.famille} ${teinte}`}
                key={teinte}
                onClick={() => setValue(teinte)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: teinte,
                  border: actuelle === teinte.toLowerCase() ? '3px solid var(--theme-elevation-800)' : '1px solid rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                }}
                title={`${teinte} — contraste ${contrasteAvecBlanc(teinte).toFixed(1)}:1`}
                type="button"
              />
            ))}
          </div>
        </div>
      ))}

      {value && !lisibleAvecBlanc(value) && (
        <p style={{ color: 'var(--theme-error-500)', marginTop: '0.5rem' }}>
          Cette couleur est claire : le texte blanc serait illisible dessus (contraste {contrasteAvecBlanc(value).toFixed(1)}:1,
          minimum 4,5:1). Choisissez une teinte plus foncée.
        </p>
      )}
      {showError && errorMessage && <p style={{ color: 'var(--theme-error-500)', marginTop: '0.5rem' }}>{errorMessage}</p>}
      {field?.admin?.description && (
        <p style={{ marginTop: '0.4rem', opacity: 0.7, fontSize: 12 }}>{field.admin.description as string}</p>
      )}
    </div>
  )
}
