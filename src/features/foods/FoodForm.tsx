import { useState } from 'react'
import { TextField } from '../../components/TextField'
import { NumberField } from '../../components/NumberField'
import { Button, ScreenHeader } from '../../components/ui'
import { addFood, updateFood, type FoodInput } from '../../data/foods'
import { t } from '../../data/i18n'
import type { Food, Unit } from '../../data/types'

type NumOrEmpty = number | ''

interface Props {
  existing?: Food
  initial?: Partial<FoodInput>
  onDone: () => void
  onCancel: () => void
}

export function FoodForm({ existing, initial, onDone, onCancel }: Props) {
  const seed = existing ?? initial ?? {}

  const [name, setName] = useState(seed.name ?? '')
  const [brand, setBrand] = useState(seed.brand ?? '')
  const [unit, setUnit] = useState<Unit>(seed.unit ?? 'g')
  const [kcal, setKcal] = useState<NumOrEmpty>(seed.kcal ?? '')
  const [protein, setProtein] = useState<NumOrEmpty>(seed.protein ?? '')
  const [carbs, setCarbs] = useState<NumOrEmpty>(seed.carbs ?? '')
  const [fat, setFat] = useState<NumOrEmpty>(seed.fat ?? '')
  const [fiber, setFiber] = useState<NumOrEmpty>(seed.fiber ?? '')
  const [sugar, setSugar] = useState<NumOrEmpty>(seed.sugar ?? '')
  const [pieceGrams, setPieceGrams] = useState<NumOrEmpty>(seed.pieceGrams ?? '')
  const [pieceLabel, setPieceLabel] = useState(seed.pieceLabel ?? '')
  const [packWeight, setPackWeight] = useState<NumOrEmpty>('')
  const [packCount, setPackCount] = useState<NumOrEmpty>('')
  const [saving, setSaving] = useState(false)

  const num = (v: NumOrEmpty) => (typeof v === 'number' ? v : 0)

  // pieceLabel is user data and stays untranslated; only the fallback for an
  // empty one comes from the catalogue.
  const pieceName = pieceLabel || t('add.piece')

  const canSave =
    name.trim().length > 0 &&
    typeof kcal === 'number' &&
    typeof protein === 'number' &&
    typeof carbs === 'number' &&
    typeof fat === 'number'

  const derivedKcal = num(protein) * 4 + num(carbs) * 4 + num(fat) * 9
  const kcalGap =
    typeof kcal === 'number' && kcal > 0 ? Math.abs(derivedKcal - kcal) / kcal : 0
  const showKcalWarning = kcalGap > 0.15

  const canCalculate =
    typeof packWeight === 'number' &&
    packWeight > 0 &&
    typeof packCount === 'number' &&
    packCount > 0

  function calculatePiece() {
    if (!canCalculate) return
    setPieceGrams(Math.round(((packWeight as number) / (packCount as number)) * 10) / 10)
  }

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)

    const payload: FoodInput = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      unit,
      kcal: num(kcal),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
      fiber: typeof fiber === 'number' ? fiber : undefined,
      sugar: typeof sugar === 'number' ? sugar : undefined,
      pieceGrams: typeof pieceGrams === 'number' && pieceGrams > 0 ? pieceGrams : undefined,
      pieceLabel: pieceLabel.trim() || undefined,
    }

    if (existing?.id) {
      await updateFood(existing.id, payload)
    } else {
      await addFood(payload)
    }

    setSaving(false)
    onDone()
  }

  return (
    <div className="stack">
      <ScreenHeader title={existing ? t('form.editTitle') : t('form.newTitle')} />

      <TextField
        label={t('form.name')}
        value={name}
        onChange={setName}
        placeholder={t('form.namePlaceholder')}
      />
      <TextField label={t('form.brand')} value={brand} onChange={setBrand} />

      <label className="field">
        <span className="field-label">{t('form.measuredIn')}</span>
        <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
          <option value="g">{t('form.grams')}</option>
          <option value="ml">{t('form.millilitres')}</option>
        </select>
      </label>

      <h3 style={{ marginTop: '1.25rem' }}>{t('form.valuesPer', { unit })}</h3>

      <NumberField
        label={t('form.calories')}
        value={kcal}
        onChange={setKcal}
        suffix="kcal"
        min={0}
      />
      <NumberField
        label={t('form.protein')}
        value={protein}
        onChange={setProtein}
        suffix="g"
        min={0}
      />
      <NumberField
        label={t('form.carbs')}
        value={carbs}
        onChange={setCarbs}
        suffix="g"
        min={0}
      />
      <NumberField label={t('form.fat')} value={fat} onChange={setFat} suffix="g" min={0} />
      <NumberField
        label={t('form.fiber')}
        value={fiber}
        onChange={setFiber}
        suffix="g"
        min={0}
      />
      <NumberField
        label={t('form.sugar')}
        value={sugar}
        onChange={setSugar}
        suffix="g"
        min={0}
      />

      <h3 style={{ marginTop: '1.5rem' }}>{t('form.piecesTitle')}</h3>
      <p className="muted">{t('form.piecesNote')}</p>

      <TextField
        label={t('form.pieceLabel')}
        value={pieceLabel}
        onChange={setPieceLabel}
        placeholder={t('form.pieceLabelPlaceholder')}
      />

      <div className="card" style={{ marginBottom: '0.875rem' }}>
        <div className="field-label">{t('form.fromPackage')}</div>
        <NumberField
          label={t('form.packWeight')}
          value={packWeight}
          onChange={setPackWeight}
          suffix={unit}
          min={0}
        />
        <NumberField
          label={t('form.packCount')}
          value={packCount}
          onChange={setPackCount}
          min={0}
        />
        <Button size="sm" disabled={!canCalculate} onClick={calculatePiece}>
          {t('form.calculate')}
        </Button>
      </div>

      <NumberField
        label={t('form.pieceWeight', { label: pieceName })}
        value={pieceGrams}
        onChange={setPieceGrams}
        suffix={unit}
        min={0}
      />

      {typeof pieceGrams === 'number' && pieceGrams > 0 && typeof kcal === 'number' && (
        <p className="muted">
          {t('form.pieceKcal', {
            label: pieceName,
            n: Math.round((kcal * pieceGrams) / 100),
          })}
        </p>
      )}

      {showKcalWarning && (
        <p className="warn">
          {t('form.kcalWarning', {
            derived: Math.round(derivedKcal),
            entered: kcal,
          })}
        </p>
      )}

      <div className="form-actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <span className="grow">
          <Button variant="primary" block onClick={handleSave} disabled={!canSave || saving}>
            {existing ? t('form.saveChanges') : t('form.addFood')}
          </Button>
        </span>
      </div>
    </div>
  )
}