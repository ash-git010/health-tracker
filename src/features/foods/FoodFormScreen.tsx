import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FoodForm } from './FoodForm'
import { getFood, type FoodInput } from '../../data/foods'
import { Empty } from '../../components/ui'
import type { Food } from '../../data/types'

export function FoodFormScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [existing, setExisting] = useState<Food | undefined>()
  const [loading, setLoading] = useState(!!id)

  const prefill = (location.state as { prefill?: Partial<FoodInput> } | null)?.prefill

  useEffect(() => {
    if (!id) return
    getFood(Number(id)).then((food) => {
      setExisting(food)
      setLoading(false)
    })
  }, [id])

  if (loading) return <Empty>Loading…</Empty>

  return (
    <FoodForm
      existing={existing}
      initial={prefill}
      onDone={() => navigate('/meals/foods')}
      onCancel={() => navigate(-1)}
    />
  )
}