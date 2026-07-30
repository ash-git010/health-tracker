import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getEntriesForDate, deleteEntry, sumEntries, MEALS, type Meal } from '../../data/log'
import { getGoals, macroGramsFromGoals } from '../../data/goals'
import { todayISO, addDays, formatDay } from '../../data/dates'
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => setDate(addDays(date, -1))} style={{ padding: '0.4rem 0.8rem' }}>
          ‹
        </button>
        <h2 style={{ fontSize: '1.1rem', flex: 1, textAlign: 'center', margin: 0 }}>
          {formatDay(date)}
        </h2>
        <button
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= todayISO()}
          style={{ padding: '0.4rem 0.8rem', opacity: date >= todayISO() ? 0.4 : 1 }}
        >
          ›
        </button>
      </div>

      {goals && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem',
            margin: '1rem 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <strong style={{ fontSize: '1.3rem' }}>{Math.round(totals.kcal)}</strong>
            <span style={{ opacity: 0.7 }}>/ {goals.dailyCalories} kcal</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.9rem', opacity: 0.7 }}>
              {Math.max(0, goals.dailyCalories - Math.round(totals.kcal))} left
            </span>
          </div>

          {targets && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <MacroRow label="Protein" value={totals.protein} target={targets.protein} />
              <MacroRow label="Carbs" value={totals.carbs} target={targets.carbs} />
              <MacroRow label="Fat" value={totals.fat} target={targets.fat} />
            </div>
          )}

          {goals.minProteinGrams > 0 && (
            <p
              style={{
                fontSize: '0.85rem',
                marginTop: '0.5rem',
                marginBottom: 0,
                opacity: totals.protein >= goals.minProteinGrams ? 0.6 : 1,
                color: totals.protein >= goals.minProteinGrams ? 'inherit' : 'var(--warn)',
              }}
            >
              {totals.protein >= goals.minProteinGrams
                ? `Protein minimum met (${goals.minProteinGrams}g)`
                : `${Math.round(goals.minProteinGrams - totals.protein)}g below your protein minimum`}
            </p>
          )}
        </div>
      )}

      {MEALS.map((meal) => {
        const mealEntries = (entries ?? []).filter((e) => e.meal === meal)
        const mealTotal = sumEntries(mealEntries)

        return (
          <div key={meal} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ textTransform: 'capitalize', flex: 1 }}>{meal}</strong>
              {mealEntries.length > 0 && (
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  {Math.round(mealTotal.kcal)} kcal
                </span>
              )}
              <button
                onClick={() => setAdding(meal)}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
              >
                +
              </button>
            </div>

            {mealEntries.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  {e.foodName}
                  <span style={{ opacity: 0.6 }}> · {e.amount}{e.unit}</span>
                </div>
                <span>{Math.round(e.kcal)}</span>
                <button
                  onClick={() => e.id && deleteEntry(e.id)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                >
                  ×
                </button>
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
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ opacity: 0.7 }}>
          {Math.round(value)} / {target}g
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '2px' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--text-muted)',
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  )
}