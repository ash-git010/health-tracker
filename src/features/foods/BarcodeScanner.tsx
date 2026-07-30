import { useEffect, useRef, useState } from 'react'

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', flex: 1 }}>Scan barcode</h2>
        <button onClick={onCancel} style={{ padding: '0.4rem 0.8rem' }}>
          Cancel
        </button>
      </div>

      {supported && !error && (
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: '8px',
            marginTop: '0.75rem',
            background: '#000',
          }}
        />
      )}

      {!supported && (
        <p style={{ fontSize: '0.9rem', marginTop: '0.75rem' }}>
          This browser can't scan barcodes. Type the number below instead.
        </p>
      )}

      {error && <p style={{ fontSize: '0.9rem', color: 'var(--warn)' }}>{error}</p>}

      <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '1rem' }}>
        Or enter the barcode number:
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          inputMode="numeric"
          value={manual}
          placeholder="4000521006709"
          onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
          style={{ flex: 1, padding: '0.6rem' }}
        />
        <button
          onClick={() => manual.length >= 8 && onDetected(manual)}
          disabled={manual.length < 8}
          style={{ padding: '0.6rem 1rem', opacity: manual.length >= 8 ? 1 : 0.5 }}
        >
          Look up
        </button>
      </div>
    </div>
  )
}