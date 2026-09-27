'use client'

import type { NumberFieldClientComponent } from 'payload'
import { FieldLabel, useField } from '@payloadcms/ui'

import { INTENSITE_TEINTE_ORIGINE } from '../couleurs'

// Curseur 0–100 % : évite la saisie au clavier, et « Rétablir » remet l'intensité d'origine.
export const PourcentageChamp: NumberFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<number>({ path })
  const actuel = typeof value === 'number' ? value : INTENSITE_TEINTE_ORIGINE

  return (
    <div className="field-type number" style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label={field?.label} path={path} required={field?.required} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
        <input
          aria-label={String(field?.label ?? 'Pourcentage')}
          className="text"
          max={100}
          min={0}
          onChange={(e) => setValue(e.target.value === '' ? INTENSITE_TEINTE_ORIGINE : Number(e.target.value))}
          step={1}
          style={{ width: '6rem' }}
          type="number"
          value={value ?? ''}
        />
        <span aria-hidden style={{ opacity: 0.7 }}>
          %
        </span>
        <input
          aria-label={`${String(field?.label ?? 'Pourcentage')} — curseur`}
          max={100}
          min={0}
          onChange={(e) => setValue(Number(e.target.value))}
          step={5}
          style={{ flex: '1 1 12rem', maxWidth: '20rem' }}
          type="range"
          value={Math.min(100, Math.max(0, actuel))}
        />
        <button
          className="btn btn--style-secondary btn--size-small"
          disabled={actuel === INTENSITE_TEINTE_ORIGINE}
          onClick={() => setValue(INTENSITE_TEINTE_ORIGINE)}
          type="button"
        >
          Rétablir {INTENSITE_TEINTE_ORIGINE} %
        </button>
      </div>

      {showError && errorMessage && <p style={{ color: 'var(--theme-error-500)', marginTop: '0.5rem' }}>{errorMessage}</p>}
      {field?.admin?.description && (
        <p style={{ marginTop: '0.4rem', opacity: 0.7, fontSize: 12 }}>{field.admin.description as string}</p>
      )}
    </div>
  )
}
