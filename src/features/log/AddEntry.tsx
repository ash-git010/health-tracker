import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Search, ScanLine, Plus } from 'lucide-react'
import { listFoods, macrosForAmount, amountInBaseUnit, hasPieces } from '../../data/foods'
import { fuzzySearch } from '../../data/search'
import { logFood, mealLabel, MEALS, type Meal } from '../../data/log'
import { t } from '../../data/i18n'
import { Button, Card, ScreenHeader } from '../../components/ui'
import { NumberField } from '../../components/NumberField'
import type { Food } from '../../data/types'

interface Props {
  date: string
  defaultMeal: Meal
  onDone: () => void
  onCancel: () => void
}

export function AddEntry({ date, defaultMeal, onDone, onCancel }: Props) {
  const foods = useLiveQuery(() => listFoods(), [])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const [amount, setAmount] = useState<number | ''>('')
  const [meal, setMeal] = useState<Meal>(defaultMeal)
  const [mode, setMode] = useState<'base' | 'piece'>('base')

  const filtered = fuzzySearch(foods ?? [], search, (f) => `${f.name} ${f.brand ?? ''}`)

  const grams =
    selected && typeof amount === 'number' ? amountInBaseUnit(selected, amount, mode) : 0

  const preview = selected && grams > 0 ? macrosForAmount(selected, grams) : null

  async function handleAdd() {
    if (!selected || grams <= 0) return
    await logFood(selected, grams, meal, date)
    onDone()
  }

  function pickFood(food: Food) {
    setSelected(food)
    setMode(hasPieces(food) ? 'piece' : 'base')
    setAmount('')
  }

  if (!selected) {
    const linkState = { returnTo: '/meals/today/add', meal, date }

    return (
      <div style={{ paddingBottom: '2rem' }}>
        <ScreenHeader
          title={t('add.title')}
          action={
            <Button size="sm" variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          }
        />

        <input
          type="text"
          value={search}
          placeholder={t('add.searchYours')}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: '1rem' }}
        />

        <div className="row" style={{ gap: '0.5rem', marginBottom: '1.75rem' }}>
          <Link
            to="/meals/foods/search"
            state={{ ...linkState, query: search }}
            className="btn grow"
            style={{ textDecoration: 'none' }}
          >
            <Search size={16} /> {t('add.search')}
          </Link>
          <Link
            to="/meals/foods/scan"
            state={linkState}
            className="btn grow"
            style={{ textDecoration: 'none' }}
          >
            <ScanLine size={16} /> {t('add.scan')}
          </Link>
          <Link
            to="/meals/foods/new"
            state={linkState}
            className="btn grow"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> {t('add.new')}
          </Link>
        </div>

        {filtered.length > 0 && <h3>{t('add.yourFoods')}</h3>}

        {filtered.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            {search ? t('add.noMatch', { query: search }) : t('add.noFoods')}
          </p>
        )}

        <div>
          {filtered.map((food) => (
            <button
              key={food.id}
              className="btn-plain food-option"
              onClick={() => pickFood(food)}
            >
              <span style={{ display: 'block', fontWeight: 600 }}>{food.name}</span>
              <span className="faint" style={{ display: 'block' }}>
                {t('add.perHundred', { kcal: food.kcal, unit: food.unit })}
                {hasPieces(food) &&
                  ` · ${t('add.perPiece', {
                    label: food.pieceLabel || t('add.piece'),
                    grams: food.pieceGrams ?? 0,
                    unit: food.unit,
                  })}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader
        title={selected.name}
        onBack={() => setSelected(null)}
      />

      {hasPieces(selected) && (
        <div className="row" style={{ marginBottom: '1rem' }}>
          <Button
            variant={mode === 'piece' ? 'primary' : 'default'}
            onClick={() => {
              setMode('piece')
              setAmount('')
            }}
          >
            {/* pieceLabel is stored data and stays untranslated, so English
                pluralisation cannot be bolted onto it — 'Scheibe' would
                become 'Scheibes'. Shown as-is. */}
            {selected.pieceLabel || t('add.pieces')}
          </Button>
          <Button
            variant={mode === 'base' ? 'primary' : 'default'}
            onClick={() => {
              setMode('base')
              setAmount('')
            }}
          >
            {selected.unit === 'ml' ? t('add.millilitres') : t('add.grams')}
          </Button>
        </div>
      )}

      <NumberField
        label={t('add.amount')}
        value={amount}
        onChange={setAmount}
        autoFocus
        suffix={mode === 'piece' ? selected.pieceLabel || t('add.pcs') : selected.unit}
      />

      <label className="field">
        <span className="field-label">{t('add.meal')}</span>
        <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {mealLabel(m)}
            </option>
          ))}
        </select>
      </label>

      {preview && (
        <Card style={{ marginTop: '1.25rem' }}>
          <div className="row" style={{ alignItems: 'baseline', gap: '0.35rem' }}>
            <span className="stat-sm">{preview.kcal}</span>
            <span className="stat-unit">kcal</span>
          </div>
          <div className="muted" style={{ marginTop: '0.35rem' }}>
            {t('add.macros', {
              p: preview.protein,
              c: preview.carbs,
              f: preview.fat,
            })}
          </div>
          {mode === 'piece' && (
            <div className="faint" style={{ marginTop: '0.25rem' }}>
              = {Math.round(grams)}
              {selected.unit}
            </div>
          )}
        </Card>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Button variant="primary" block onClick={handleAdd} disabled={!preview}>
          {t('add.submit')}
        </Button>
      </div>
    </div>
  )
}