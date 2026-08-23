import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FoodForm } from './FoodForm'
import { getFood, type FoodInput } from '../../data/foods'
import { Empty } from '../../components/ui'
import type { Food } from '../../data/types'
import { t } from '../../data/i18n'

interface FormState {
  prefill?: Partial<FoodInput>
  returnTo?: string
  meal?: string
  date?: string
}

export function FoodFormScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [existing, setExisting] = useState<Food | undefined>()
  const [loading, setLoading] = useState(!!id)

  const state = (location.state ?? {}) as FormState

  useEffect(() => {
    if (!id) return
    getFood(id).then((food) => {
      setExisting(food)
      setLoading(false)
    })
  }, [id])

  function goBack() {
    if (state.returnTo) {
      navigate(state.returnTo, { state: { meal: state.meal, date: state.date } })
    } else {
      navigate('/meals/foods')
    }
  }

  if (loading) return <Empty>{t('app.loading')}</Empty>

  return (
    <FoodForm
      existing={existing}
      initial={state.prefill}
      onDone={goBack}
      onCancel={() => navigate(-1)}
    />
  )
}