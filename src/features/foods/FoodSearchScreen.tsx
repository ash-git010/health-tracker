import { useNavigate } from 'react-router-dom'
import { FoodSearch } from './FoodSearch'

export function FoodSearchScreen() {
  const navigate = useNavigate()
  return (
    <FoodSearch
      onPicked={(food) => navigate('/meals/foods/new', { state: { prefill: food } })}
      onCancel={() => navigate('/meals/foods')}
    />
  )
}