let ctx: AudioContext | null = null
let master: GainNode | null = null

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextClass) return
  ctx = new AudioContextClass()

  // Compressor lets the chime sit louder without clipping when
  // several notes overlap.
  const gain = ctx.createGain()
  gain.gain.value = 0.9

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -18
  compressor.ratio.value = 4
  compressor.attack.value = 0.003
  compressor.release.value = 0.25

  gain.connect(compressor)
  compressor.connect(ctx.destination)
  master = gain
}

// A plain sine sounds thin. Stacking the octave and the fifth above it
// at low level gives a bell-like tone that carries in a noisy gym.
const PARTIALS: { ratio: number; level: number }[] = [
  { ratio: 1, level: 1 },
  { ratio: 2, level: 0.3 },
  { ratio: 3, level: 0.1 },
]

function note(startAt: number, frequency: number, duration: number, peak: number): void {
  if (!ctx || !master) return

  for (const partial of PARTIALS) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = frequency * partial.ratio
    osc.connect(gain)
    gain.connect(master)

    const level = peak * partial.level
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(level, startAt + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    osc.start(startAt)
    osc.stop(startAt + duration + 0.05)
  }
}

export function playBeep(): void {
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const t = ctx.currentTime + 0.02

  // Rising E–G#–B, then E an octave up left to ring. ~2.2s end to end.
  note(t, 659.25, 0.45, 0.35)
  note(t + 0.18, 830.61, 0.45, 0.35)
  note(t + 0.36, 987.77, 0.6, 0.4)
  note(t + 0.62, 1318.51, 1.6, 0.45)
}