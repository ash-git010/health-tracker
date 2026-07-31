import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getEntriesForDate, deleteEntry, sumEntries, MEALS, type Meal } from '../../data/log'
import { getGoals, macroGramsFromGoals } from '../../data/goals'
import { todayISO, addDays, formatDay } from '../../data/dates'
import { Button, Card } from '../../components/ui'
import { AddEntry } from './AddEntry'

export function TodayScreen() {
  const [date, setDate] = useState(todayISO())
  const [adding, setAdding] = useState<Meal | null>(null)

  const entries = useLiveQuery(() => getEntriesForDate(date), [date])
  const goals = useLiveQuery(() => getGoals(), [])

  if (adding) {
    return (
      <AddEntry
        date={date}
        defaultMeal={adding}
        onDone={() => setAdding(null)}
        onCancel={() => setAdding(null)}
      />
    )
  }

  const totals = sumEntries(entries ?? [])
  const targets = goals ? macroGramsFromGoals(goals) : null
  const proteinMet = goals ? totals.protein >= goals.minProteinGrams : true

  return (
    <div>
      <div className="row">
        <Button size="sm" variant="ghost" onClick={() => setDate(addDays(date, -1))}>
          ‹
        </Button>
        <h2 className="grow" style={{ textAlign: 'center', margin: 0 }}>
          {formatDay(date)}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          disabled={date >= todayISO()}
          onClick={() => setDate(addDays(date, 1))}
        >
          ›
        </Button>
      </div>

      {goals && (
        <Card style={{ margin: '0.75rem 0 1.25rem' }}>
          <div className="row" style={{ alignItems: 'baseline' }}>
            <strong style={{ fontSize: '1.35rem' }}>{Math.round(totals.kcal)}</strong>
            <span className="muted">/ {goals.dailyCalories} kcal</span>
            <span className="muted grow" style={{ textAlign: 'right' }}>
              {Math.max(0, goals.dailyCalories - Math.round(totals.kcal))} left
            </span>
          </div>

          {targets && (
            <div style={{ marginTop: '0.75rem' }}>
              <MacroRow label="Protein" value={totals.protein} target={targets.protein} />
              <MacroRow label="Carbs" value={totals.carbs} target={targets.carbs} />
              <MacroRow label="Fat" value={totals.fat} target={targets.fat} />
            </div>
          )}

          {goals.minProteinGrams > 0 && (
            <p className={proteinMet ? 'muted' : 'warn'} style={{ margin: '0.5rem 0 0' }}>
              {proteinMet
                ? `Protein minimum met (${goals.minProteinGrams}g)`
                : `${Math.round(goals.minProteinGrams - totals.protein)}g below your protein minimum`}
            </p>
          )}
        </Card>
      )}

      {MEALS.map((meal) => {
        const mealEntries = (entries ?? []).filter((e) => e.meal === meal)
        const mealTotal = sumEntries(mealEntries)

        return (
          <div key={meal} style={{ marginBottom: '1.25rem' }}>
            <div className="row">
              <strong className="grow" style={{ textTransform: 'capitalize' }}>
                {meal}
              </strong>
              {mealEntries.length > 0 && (
                <span className="muted">{Math.round(mealTotal.kcal)} kcal</span>
              )}
              <Button size="sm" onClick={() => setAdding(meal)}>
                +
              </Button>
            </div>

            {mealEntries.map((e) => (
              <div key={e.id} className="list-item">
                <div className="grow">
                  {e.foodName}
                  <span className="muted">
                    {' '}
                    · {e.amount}
                    {e.unit}
                  </span>
                </div>
                <span className="muted">{Math.round(e.kcal)}</span>
                <Button size="sm" variant="ghost" onClick={() => e.id && deleteEntry(e.id)}>
                  ×
                </Button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function MacroRow({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div className="row" style={{ fontSize: '0.875rem' }}>
        <span className="grow">{label}</span>
        <span className="muted">
          {Math.round(value)} / {target}g
        </span>
      </div>
      <div
        style={{
          height: '4px',
          background: 'var(--surface-2)',
          borderRadius: '2px',
          marginTop: '3px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--accent)',
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  )
}