import { useRef, useCallback } from 'react'

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null)
  const mutedRef = useRef(false)

  const ctx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const osc = (freq: number, type: OscillatorType, startT: number, dur: number, gain: number, freqEnd?: number) => {
    const c = ctx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.type = type
    o.frequency.setValueAtTime(freq, startT)
    if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(freqEnd, startT + dur)
    g.gain.setValueAtTime(gain, startT)
    g.gain.exponentialRampToValueAtTime(0.0001, startT + dur)
    o.start(startT); o.stop(startT + dur + 0.01)
  }

  const ping = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    osc(820, 'sine', t, 0.45, 0.12)
  }, [])

  const warningBeep = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    osc(1100, 'square', t,       0.14, 0.09)
    osc(1100, 'square', t + 0.22, 0.14, 0.09)
  }, [])

  const alertBeep = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    osc(500, 'sawtooth', t,       0.18, 0.08, 1000)
    osc(500, 'sawtooth', t + 0.22, 0.18, 0.08, 1000)
    osc(500, 'sawtooth', t + 0.44, 0.18, 0.08, 1000)
  }, [])

  const urgentAlarm = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    osc(440, 'sawtooth', t,       0.12, 0.1, 880)
    osc(440, 'sawtooth', t + 0.16, 0.12, 0.1, 880)
    osc(440, 'sawtooth', t + 0.32, 0.12, 0.1, 880)
    osc(440, 'sawtooth', t + 0.48, 0.12, 0.1, 880)
  }, [])

  const successChime = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    ;[523, 659, 784, 1047].forEach((f, i) => osc(f, 'sine', t + i * 0.13, 0.5, 0.18))
  }, [])

  const linkDegradeTone = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    osc(300, 'sine', t, 0.6, 0.08, 150)
  }, [])

  const terminationImpact = useCallback(() => {
    if (mutedRef.current) return
    const t = ctx().currentTime
    // Sharp descending sweep + bass thud + tail noise
    osc(1400, 'sawtooth', t,        0.35, 0.18, 60)
    osc(90,   'sine',     t + 0.12, 0.55, 0.28)
    osc(220,  'triangle', t + 0.30, 0.40, 0.12, 50)
  }, [])

  const setMuted = useCallback((m: boolean) => { mutedRef.current = m }, [])
  const isMuted = () => mutedRef.current

  return { ping, warningBeep, alertBeep, urgentAlarm, successChime, linkDegradeTone, terminationImpact, setMuted, isMuted }
}
