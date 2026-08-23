import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, ScanLine, Plus, Pencil, Trash2 } from 'lucide-react'
import { listFoods, deleteFood, hasPieces } from '../../data/foods'
import { fuzzySearch } from '../../data/search'
import { t } from '../../data/i18n'
import { Card, Empty, ScreenHeader } from '../../components/ui'
import { useConfirm } from '../../components/DialogProvider'
import type { Food } from '../../data/types'

export function FoodListScreen() {
  const foods = useLiveQuery(() => listFoods(), [])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const confirm = useConfirm()

  const filtered = fuzzySearch(foods ?? [], search, (f) => `${f.name} ${f.brand ?? ''}`)

  async function handleDelete(food: Food) {
    if (!food.id) return
    const ok = await confirm({
      title: t('foods.deleteTitle', { name: food.name }),
      message: t('foods.deleteMessage'),
      confirmLabel: t('foods.deleteConfirm'),
      destructive: true,
    })
    if (ok) await deleteFood(food.id)
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <ScreenHeader title={t('sections.meals.foods')} />

      <div className="row" style={{ marginBottom: '1rem' }}>
        <Link to="/meals/foods/search" className="btn grow" style={{ textDecoration: 'none' }}>
          <Search size={16} /> {t('add.search')}
        </Link>
        <Link to="/meals/foods/scan" className="btn grow" style={{ textDecoration: 'none' }}>
          <ScanLine size={16} /> {t('add.scan')}
        </Link>
        <Link
          to="/meals/foods/new"
          className="btn btn-primary grow"
          style={{ textDecoration: 'none' }}
        >
          <Plus size={16} /> {t('add.new')}
        </Link>
      </div>

      <input
        type="text"
        value={search}
        placeholder={t('foods.filter')}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />

      {foods === undefined && <Empty>{t('app.loading')}</Empty>}

      {foods && filtered.length === 0 && (
        <Empty>{search ? t('foods.noMatches') : t('foods.empty')}</Empty>
      )}

      {filtered.map((food) => (
        <Card key={food.id} style={{ marginBottom: '0.5rem', padding: '0.875rem' }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row">
                <strong className="grow" style={{ minWidth: 0 }}>
                  {food.name}
                </strong>
                <span className="muted num">
                  {food.kcal} kcal
                  <span className="faint">{t('foods.per100', { unit: food.unit })}</span>
                </span>
              </div>

              <div className="faint" style={{ marginTop: '0.2rem' }}>
                {[
                  t('macro.pShort', { n: food.protein }),
                  t('macro.cShort', { n: food.carbs }),
                  t('macro.fShort', { n: food.fat }),
                  food.brand,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>

              {hasPieces(food) && (
                <div className="faint">
                  {t('add.perPiece', {
                    label: food.pieceLabel || t('add.piece'),
                    grams: food.pieceGrams ?? 0,
                    unit: food.unit,
                  })}
                </div>
              )}
            </div>

            <button
              className="icon-btn"
              aria-label={t('foods.editAria', { name: food.name })}
              onClick={() => navigate(`/meals/foods/${food.id}/edit`)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn"
              aria-label={t('foods.deleteAria', { name: food.name })}
              onClick={() => handleDelete(food)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}