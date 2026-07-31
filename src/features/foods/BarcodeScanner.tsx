import { useEffect, useRef, useState } from 'react'
import { Button, ScreenHeader } from '../../components/ui'

interface Props {
  onDetected: (barcode: string) => void
  onCancel: () => void
}

export function BarcodeScanner({ onDetected, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')

  const supported = 'BarcodeDetector' in window

  useEffect(() => {
    if (!supported) return

    let stream: MediaStream | null = null
    let timer: number | undefined
    let stopped = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const Detector = (window as any).BarcodeDetector
        const detector = new Detector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
        })

        timer = window.setInterval(async () => {
          if (!videoRef.current || stopped) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0 && codes[0].rawValue) {
              stopped = true
              onDetected(codes[0].rawValue)
            }
          } catch {
            // a failed frame is normal, keep scanning
          }
        }, 400)
      } catch (err) {
        setError(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera permission denied. Enter the number manually below.'
            : 'Could not start the camera. Enter the number manually below.'
        )
      }
    }

    start()

    return () => {
      stopped = true
      if (timer) clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [supported, onDetected])

  return (
    <div>
      <ScreenHeader
        title="Scan barcode"
        action={
          <Button size="sm" onClick={onCancel}>
            Cancel
          </Button>
        }
      />

      {supported && !error && (
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: 'var(--radius)',
            background: '#000',
            marginBottom: '0.5rem',
          }}
        />
      )}

      {!supported && (
        <p className="warn">
          Camera scanning works on Android only — Safari doesn't support it, so iPhones
          and iPads need to use the number field below.
        </p>
      )}

      {error && <p className="warn">{error}</p>}

      {supported && !error && (
        <p className="muted">Point the camera at the barcode. It'll pick it up on its own.</p>
      )}

      <label className="field" style={{ marginTop: '1rem' }}>
        <span className="field-label">Or enter the barcode number</span>
        <span className="row">
          <input
            type="text"
            inputMode="numeric"
            value={manual}
            placeholder="4000521006709"
            onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
          />
          <Button
            onClick={() => manual.length >= 8 && onDetected(manual)}
            disabled={manual.length < 8}
          >
            Look up
          </Button>
        </span>
      </label>
    </div>
  )
}