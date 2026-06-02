import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { ScenarioState, ScenarioPhase } from '../types'

type Action =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'TICK' }
  | { type: 'AUTHORIZE' }
  | { type: 'GENERATE_REPORT' }

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

const deriveConfidence = (elapsed: number): number => {
  if (elapsed < 2) return 0.04 + Math.sin(elapsed * 0.5) * 0.02
  const t = (elapsed - 2) / 11
  return Math.min(0.86, 0.86 * sigmoid(8 * (t - 0.5)))
}

const derivePhase = (elapsed: number, authorized: boolean, authTime: number | null): ScenarioPhase => {
  if (elapsed === 0) return 'idle'
  if (elapsed < 2)  return 'monitoring'
  if (elapsed < 7)  return 'detecting'
  if (elapsed < 11) return 'localizing'
  if (elapsed < 14) return 'classified'
  if (!authorized) return 'awaiting_auth'
  if (authTime !== null && elapsed < authTime + 6) return 'simulating'
  if (authTime !== null && elapsed >= authTime + 6) return 'neutralized'
  return 'awaiting_auth'
}

const deriveFPS = (elapsed: number, authTime: number | null): number => {
  if (authTime === null) return 30
  const t = elapsed - authTime
  if (t < 0) return 30
  return Math.max(18, 30 - 12 * (1 - Math.exp(-t / 2)))
}

const initialState: ScenarioState = {
  phase: 'idle',
  elapsed: 0,
  isPaused: false,
  confidence: 0.04,
  snrDb: 4,
  harmonicMatch: 0.12,
  fps: 30,
  linkQuality: 1.0,
  couplingScore: 0.0,
  resonanceMatch: 0.0,
  sensorsConfirmed: 0,
  neutralizationAuthorized: false,
  authTime: null,
  reportGenerated: false,
}

function reducer(state: ScenarioState, action: Action): ScenarioState {
  switch (action.type) {
    case 'START':
      if (state.phase === 'idle') return { ...state, phase: 'monitoring', isPaused: false }
      return { ...state, isPaused: false }

    case 'PAUSE':
      return { ...state, isPaused: true }

    case 'RESET':
      return { ...initialState }

    case 'TICK': {
      const elapsed = state.elapsed + 0.15
      // Auto-authorize the moment we hit the auth gate so the demo flows
      // end-to-end without a manual click — termination then lands ~6 s later.
      let authorized = state.neutralizationAuthorized
      let authTime   = state.authTime
      if (!authorized && elapsed >= 14) {
        authorized = true
        authTime   = elapsed
      }
      const conf = deriveConfidence(elapsed)
      const phase = derivePhase(elapsed, authorized, authTime)
      const fps = deriveFPS(elapsed, authTime)
      const linkQuality = fps / 30
      const coupling = Math.min(0.74, conf * 0.86)
      const resonance = Math.min(0.68, conf * 0.79)
      const snr = Math.min(14, conf * 16.3)
      const hm = Math.min(0.81, conf * 0.94)
      const sc = Math.min(4, Math.floor(conf * 5))
      return {
        ...state,
        elapsed,
        phase,
        neutralizationAuthorized: authorized,
        authTime,
        confidence: conf,
        snrDb: snr,
        harmonicMatch: hm,
        fps,
        linkQuality,
        couplingScore: coupling,
        resonanceMatch: resonance,
        sensorsConfirmed: Math.min(4, sc),
      }
    }

    case 'AUTHORIZE':
      return {
        ...state,
        neutralizationAuthorized: true,
        authTime: state.elapsed,
        phase: 'simulating',
      }

    case 'GENERATE_REPORT':
      return { ...state, reportGenerated: true, phase: 'reported' }

    default:
      return state
  }
}

interface ScenarioContextValue {
  state: ScenarioState
  start: () => void
  pause: () => void
  reset: () => void
  authorize: () => void
  generateReport: () => void
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null)

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (state.phase === 'idle' || state.isPaused || state.phase === 'neutralized' || state.phase === 'reported') return
    const interval = setInterval(() => dispatch({ type: 'TICK' }), 150)
    return () => clearInterval(interval)
  }, [state.phase, state.isPaused])

  const start = useCallback(() => dispatch({ type: 'START' }), [])
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
  const authorize = useCallback(() => dispatch({ type: 'AUTHORIZE' }), [])
  const generateReport = useCallback(() => dispatch({ type: 'GENERATE_REPORT' }), [])

  return (
    <ScenarioContext.Provider value={{ state, start, pause, reset, authorize, generateReport }}>
      {children}
    </ScenarioContext.Provider>
  )
}

export function useScenario() {
  const ctx = useContext(ScenarioContext)
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider')
  return ctx
}
