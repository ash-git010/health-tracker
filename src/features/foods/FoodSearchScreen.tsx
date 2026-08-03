import { useNavigate, useLocation } from 'react-router-dom'
import { FoodSearch } from './FoodSearch'

interface SearchState {
  returnTo?: string
  meal?: string
  date?: string
  query?: string
}

export function FoodSearchScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as SearchState

  function cancel() {
    if (state.returnTo) {
      navigate(state.returnTo, { state: { meal: state.meal, date: state.date } })
    } else {
      navigate('/meals/foods')
    }
  }

  return (
    <FoodSearch
      initialQuery={state.query}
      onPicked={(food) =>
        navigate('/meals/foods/new', {
          state: {
            prefill: food,
            returnTo: state.returnTo,
            meal: state.meal,
            date: state.date,
          },
        })
      }
      onCancel={cancel}
    />
  )
}