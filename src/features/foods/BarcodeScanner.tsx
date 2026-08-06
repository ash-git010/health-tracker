import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import { Button, ScreenHeader } from '../../components/ui'

interface Props {
  onDetected: (barcode: string) => void
  onCancel: () => void
}

type Engine = 'native' | 'zxing'

// Ask for the highest sensible resolution. iOS hands back roughly 640x480
// unless told otherwise, and EAN-13 bars do not survive that once the
// JavaScript decoder gets hold of them.
const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: 'environment',
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

export function BarcodeScanner({ onDetected, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectedRef = useRef(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const [starting, setStarting] = useState(true)
  const [resolution, setResolution] = useState('')

  // Hold the callback in a ref so the effect below never depends on it.
  // Passing onDetected as a dependency restarts the camera on every parent
  // render, which ZXing cannot recover from.
  const onDetectedRef = useRef(onDetected)
  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  const engine: Engine = 'BarcodeDetector' in window ? 'native' : 'zxing'

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | undefined
    let controls: IScannerControls | null = null
    let cancelled = false

    function report(code: string) {
      if (detectedRef.current || cancelled) return
      detectedRef.current = true
      onDetectedRef.current(code)
    }

    async function startNative() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
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
      const hints = new Map<DecodeHintType, unknown>()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ])
      // Spend more CPU per frame. Without this ZXing gives up on anything
      // blurred, angled, or on curved packaging.
      hints.set(DecodeHintType.TRY_HARDER, true)

      const reader = new BrowserMultiFormatReader(hints, {
        // Default is 500ms, i.e. two attempts a second. Far too slow when
        // the user is holding a phone by hand against a curved surface.
        delayBetweenScanAttempts: 100,
      })

      const started = await reader.decodeFromConstraints(
        { video: VIDEO_CONSTRAINTS },
        videoRef.current!,
        (result) => {
          if (result) report(result.getText())
        }
      )

      // Cleanup may have run while the await above was still pending. If so,
      // controls was still null then and nothing stopped this stream.
      if (cancelled) {
        started.stop()
        return
      }
      controls = started
    }

    async function start() {
      try {
        if (engine === 'native') await startNative()
        else await startZxing()
      } catch (err) {
        if (cancelled) return
        const name = err instanceof Error ? err.name : ''
        setError(
          name === 'NotAllowedError'
            ? 'Camera access is blocked. Allow it in your browser settings, or type the number below.'
            : name === 'NotFoundError'
              ? 'No camera found on this device. Type the number below.'
              : `Camera could not start${name ? ` (${name})` : ''}. Type the number below.`
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
  }, [engine])

  function handleMetadata() {
    const v = videoRef.current
    if (v) setResolution(`${v.videoWidth}×${v.videoHeight}`)
  }

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
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            onLoadedMetadata={handleMetadata}
            style={{
              width: '100%',
              display: 'block',
              borderRadius: 'var(--radius)',
              background: '#000',
            }}
          />
          {/* Guides where to hold the barcode. ZXing scans horizontal lines,
              so the band is wide and short to encourage the right rotation. */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              top: '50%',
              height: '22%',
              transform: 'translateY(-50%)',
              border: '2px solid var(--accent)',
              borderRadius: 'var(--radius)',
              pointerEvents: 'none',
              opacity: 0.9,
            }}
          />
        </div>
      )}

      {error && <p className="warn">{error}</p>}

      {!error && (
        <p className="muted">
          {starting
            ? 'Starting the camera…'
            : 'Hold the barcode inside the box, about 20cm away, level with the ground.'}
        </p>
      )}

      {!error && resolution && (
        <p className="muted" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          Camera: {resolution}
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