import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarcodeScanner } from './BarcodeScanner'
import { lookupBarcode } from '../../data/openfoodfacts'
import { Empty } from '../../components/ui'

export function BarcodeScanScreen() {
  const navigate = useNavigate()
  const [looking, setLooking] = useState(false)
  const [error, setError] = useState('')

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
      navigate('/meals/foods/new', { state: { prefill: result.food } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
      setLooking(false)
    }
  }

  if (looking) return <Empty>Looking up product…</Empty>

  return (
    <>
      {error && <p className="warn">{error}</p>}
      <BarcodeScanner onDetected={handleBarcode} onCancel={() => navigate('/meals/foods')} />
    </>
  )
}