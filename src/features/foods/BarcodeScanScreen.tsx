import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BarcodeScanner } from './BarcodeScanner'
import { lookupBarcode } from '../../data/openfoodfacts'
import { Empty } from '../../components/ui'

interface ScanState {
  returnTo?: string
  meal?: string
  date?: string
}

export function BarcodeScanScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as ScanState
  const [looking, setLooking] = useState(false)
  const [error, setError] = useState('')

  function cancel() {
    if (state.returnTo) {
      navigate(state.returnTo, { state: { meal: state.meal, date: state.date } })
    } else {
      navigate('/meals/foods')
    }
  }

  async function handleBarcode(barcode: string) {
    setLooking(true)
    setError('')
    try {
      const result = await lookupBarcode(barcode)
      if (!result.found) {
        setError(`Barcode ${barcode} isn't in the database. Add it manually instead.`)
        setLooking(false)
        return
      }
      navigate('/meals/foods/new', {
        state: {
          prefill: result.food,
          returnTo: state.returnTo,
          meal: state.meal,
          date: state.date,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
      setLooking(false)
    }
  }

  if (looking) return <Empty>Looking up product…</Empty>

  return (
    <>
      {error && <p className="warn">{error}</p>}
      <BarcodeScanner onDetected={handleBarcode} onCancel={cancel} />
    </>
  )
}