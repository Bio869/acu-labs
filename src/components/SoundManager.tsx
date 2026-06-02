import { useEffect, useRef, useState } from 'react'
import { useScenario } from '../context/ScenarioContext'
import { useAudio } from '../hooks/useAudio'

export function SoundManager() {
  const { state } = useScenario()
  const { phase, isPaused } = state
  const audio = useAudio()
  const prevPhaseRef = useRef(phase)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [muted, setMutedState] = useState(false)

  const toggleMute = () => {
    const next = !muted
    setMutedState(next)
    audio.setMuted(next)
  }

  // Phase transition sounds
  useEffect(() => {
    if (phase === prevPhaseRef.current) return
    const prev = prevPhaseRef.current
    prevPhaseRef.current = phase

    if (phase === 'detecting' && prev === 'monitoring') {
      audio.warningBeep()
      setTimeout(() => audio.warningBeep(), 600)
    } else if (phase === 'classified') {
      audio.alertBeep()
    } else if (phase === 'awaiting_auth') {
      audio.urgentAlarm()
    } else if (phase === 'simulating') {
      audio.linkDegradeTone()
    } else if (phase === 'neutralized') {
      audio.terminationImpact()
    }
  }, [phase])

  // Periodic sounds per phase — suspended while paused
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPaused) return

    const intervals: Partial<Record<typeof phase, number>> = {
      monitoring: 3200,
      detecting: 1800,
      localizing: 1400,
      classified: 900,
      awaiting_auth: 700,
      simulating: 2200,
    }

    const sounds: Partial<Record<typeof phase, () => void>> = {
      monitoring: audio.ping,
      detecting: audio.warningBeep,
      localizing: audio.warningBeep,
      classified: audio.alertBeep,
      awaiting_auth: audio.urgentAlarm,
      simulating: audio.linkDegradeTone,
    }

    const ms = intervals[phase]
    const fn = sounds[phase]
    if (ms && fn) {
      intervalRef.current = setInterval(fn, ms)
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase, isPaused])

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Unmute audio' : 'Mute audio'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-colors
        ${muted
          ? 'border-slate-600 text-slate-500 bg-slate-800/50 hover:bg-slate-700/50'
          : 'border-cyan-700/50 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10'}`}
    >
      {muted ? '🔇' : '🔊'} {muted ? 'Audio Off' : 'Audio On'}
    </button>
  )
}
