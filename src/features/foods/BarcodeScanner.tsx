import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import { Button, ScreenHeader } from '../../components/ui'

interface Props {
  onDetected: (barcode: string) => void
  onCancel: () => void
}

type Engine = 'native' | 'zxing'

export function BarcodeScanner({ onDetected, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectedRef = useRef(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const [starting, setStarting] = useState(true)

  const engine: Engine = 'BarcodeDetector' in window ? 'native' : 'zxing'

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let controls: { stop: () => void } | null = null
    let cancelled = false

    function report(code: string) {
      if (detectedRef.current || cancelled) return
      detectedRef.current = true
      onDetected(code)
    }

    async function startNative() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (cancelled) {
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
        if (!videoRef.current || cancelled) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0 && codes[0].rawValue) report(codes[0].rawValue)
        } catch {
          // a failed frame is normal
        }
      }, 400)
    }

    async function startZxing() {
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ])

      const reader = new BrowserMultiFormatReader(hints)

      controls = await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result) => {
          if (result) report(result.getText())
        }
      )
    }

    async function start() {
      try {
        if (engine === 'native') await startNative()
        else await startZxing()
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera permission denied. Enter the number manually below.'
            : 'Could not start the camera. Enter the number manually below.'
        )
      }
      if (!cancelled) setStarting(false)
    }

    start()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      controls?.stop()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [engine, onDetected])

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

      {!error && (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            borderRadius: 'var(--radius)',
            background: '#000',
            marginBottom: '0.5rem',
          }}
        />
      )}

      {error && <p className="warn">{error}</p>}

      {!error && (
        <p className="muted">
          {starting
            ? 'Starting the camera…'
            : 'Point the camera at the barcode. It will pick it up on its own.'}
        </p>
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