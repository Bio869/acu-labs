import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { useScenario } from '../context/ScenarioContext'
import { SimBadge } from '../components/SimBadge'
import type { NavTab } from '../types'

function buildSimData(elapsed: number, authTime: number | null) {
  const data = []
  const start = authTime ?? elapsed
  for (let t = 0; t <= 30; t += 0.5) {
    const simT = t - start
    const simFps = authTime === null
      ? 30
      : simT < 0 ? 30 : Math.max(18, 30 - 12 * (1 - Math.exp(-simT / 2)))
    const lq = Math.round((simFps / 30) * 100)
    data.push({
      t,
      fps: t <= elapsed ? +simFps.toFixed(1) : undefined,
      link: t <= elapsed ? lq : undefined,
      fpsBefore: 30,
      threshold: 20,
    })
  }
  return data
}

interface Props { onNavigate: (tab: NavTab) => void }

export default function SimulatedNeutralization({ onNavigate }: Props) {
  const { state, authorize, generateReport } = useScenario()
  const { phase, elapsed, fps, linkQuality, couplingScore, confidence, authTime } = state
  const [showModal, setShowModal] = useState(false)

  const canAuthorize = ['classified', 'awaiting_auth'].includes(phase)
  const isSimulating = phase === 'simulating'
  const isNeutralized = phase === 'neutralized' || phase === 'reported'
  const simData = buildSimData(elapsed, authTime)
  const lqPct = Math.round(linkQuality * 100)

  const handleConfirm = () => {
    authorize()
    setShowModal(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Big safety banner */}
      <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/5 px-6 py-4 flex items-center justify-between">
        <SimBadge />
        <div className="text-amber-400/60 text-xs font-mono">
          No real emitter · No jamming · No directed energy · Software model only
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Simulated Neutralization</h2>
          <p className="text-slate-400 text-xs">Communication-stress model — human-authorized, simulation-only workflow</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold
          ${isNeutralized ? 'border-green-500/50 bg-green-500/10 text-green-400' :
            isSimulating ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' :
            canAuthorize ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 blink' :
            'border-slate-600 bg-slate-800 text-slate-400'}`}>
          {isNeutralized ? '✓ TARGET TERMINATED in Simulation' :
           isSimulating ? '⟳ Simulation Running' :
           canAuthorize ? '⚠ Human Authorization Required' :
           '○ Awaiting Detection'}
        </div>
      </div>

      {/* Evidence summary (shows when ready) */}
      {(canAuthorize || isSimulating || isNeutralized) && (
        <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
          <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">THREAT EVIDENCE SUMMARY</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Detection Confidence', value: `${Math.round(confidence * 100)}%`, color: '#00d4ff' },
              { label: 'Sensors Confirmed', value: `${state.sensorsConfirmed}/4`, color: '#3b82f6' },
              { label: 'Coupling Risk', value: `${(couplingScore * 100).toFixed(0)}%`, color: '#f59e0b' },
              { label: 'Threat Classification', value: 'Suspected FO-UAS', color: '#ef4444' },
            ].map(m => (
              <div key={m.label} className="text-center p-3 rounded border border-[#1e3a5f] bg-[#060d1b]">
                <div className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-slate-500 text-xs mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authorization action */}
      {canAuthorize && !isSimulating && !isNeutralized && (
        <div className="rounded-lg border border-amber-600/40 bg-amber-900/5 p-6 text-center">
          <div className="text-amber-400 font-bold text-lg mb-2">Authorization Required</div>
          <div className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
            Detection confidence has exceeded the escalation threshold (65%). System recommends initiating
            simulated communication-stress neutralization. This action is software-only with no physical output.
          </div>
          <button onClick={() => setShowModal(true)}
            className="px-8 py-3 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors">
            Run Simulated Neutralization
          </button>
          <div className="mt-3 text-slate-500 text-xs">Operator authorization will be logged in the evidence report.</div>
        </div>
      )}

      {/* Simulation in progress / results */}
      {(isSimulating || isNeutralized) && (
        <div className="grid grid-cols-2 gap-4">
          {/* FPS / Link quality chart */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">
              SIMULATED VIDEO FPS + LINK QUALITY — Communication Stress Model
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={simData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 9 }} label={{ value: 'Demo time (s)', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 9 }} />
                <YAxis yAxisId="fps" domain={[15, 35]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                <YAxis yAxisId="lq" orientation="right" domain={[50, 105]} tick={{ fill: '#6b7280', fontSize: 9 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 4, fontSize: 10 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: 9, color: '#94a3b8' }} />
                <ReferenceLine yAxisId="fps" y={20} stroke="#ef4444" strokeDasharray="4 2"
                  label={{ value: '20 FPS threshold', fill: '#ef4444', fontSize: 8 }} />
                <Line yAxisId="fps" type="monotone" dataKey="fps" stroke="#06b6d4" strokeWidth={2} dot={false} name="Video FPS" connectNulls={false} />
                <Line yAxisId="lq" type="monotone" dataKey="link" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Link Quality %" strokeDasharray="6 3" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-slate-500 text-xs text-center mt-1 italic">
              Modeled communication quality degraded below operational threshold in the scenario.
            </div>
          </div>

          {/* Status panel */}
          <div className="flex flex-col gap-3">
            {/* Live meters */}
            <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
              <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">LIVE SIMULATION METERS</div>
              <div className="flex flex-col gap-4">
                {/* FPS meter */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Simulated Video FPS</span>
                    <span className="font-mono text-white">{fps.toFixed(1)} / 30</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#1e3a5f] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(fps / 30) * 100}%`, backgroundColor: fps < 22 ? '#ef4444' : '#06b6d4' }} />
                  </div>
                  {fps < 20 && <div className="text-red-400 text-xs mt-1">⚠ Below 20 FPS operational threshold</div>}
                </div>
                {/* Link quality */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Link Quality</span>
                    <span className="font-mono text-white">{lqPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#1e3a5f] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${lqPct}%`, backgroundColor: lqPct < 70 ? '#ef4444' : '#22c55e' }} />
                  </div>
                </div>
                {/* Coupling score */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Coupling Score</span>
                    <span className="font-mono text-white">{(couplingScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#1e3a5f] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${couplingScore * 100}%`, backgroundColor: '#8b5cf6' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Eliminated state */}
            {isNeutralized && (
              <div className="rounded-lg border border-green-600/40 bg-green-900/5 p-4 text-center">
                <div className="text-green-400 text-3xl mb-2">✓</div>
                <div className="text-green-400 font-bold text-sm">TARGET TERMINATED in Simulation</div>
                <div className="text-slate-400 text-xs mt-2">
                  Modeled video FPS dropped to {fps.toFixed(1)} fps — below 20 fps operational threshold.
                  Communication link quality: {lqPct}%.
                </div>
                <div className="mt-3 px-3 py-2 rounded border border-amber-500/30 bg-amber-500/5">
                  <div className="text-amber-400 text-xs font-semibold">Simulation Mode — No Physical Output</div>
                  <div className="text-slate-500 text-xs mt-0.5">This result is a non-operational software model only.</div>
                </div>
              </div>
            )}

            {/* Workflow log */}
            <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4 flex-1">
              <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">WORKFLOW AUDIT LOG</div>
              <div className="flex flex-col gap-2">
                {[
                  { t: '00:00', event: 'Scenario initialized — Monitoring mode', color: '#6b7280' },
                  { t: '00:18', event: 'Acoustic anomaly detected — Confidence rising', color: '#f59e0b' },
                  { t: '00:42', event: 'Multi-node localization confirmed (3/4 nodes)', color: '#f59e0b' },
                  { t: '01:02', event: 'Threat classified: Suspected fiber-optic drone', color: '#ef4444' },
                  { t: '01:12', event: 'Awaiting operator authorization', color: '#ef4444' },
                  ...(isSimulating || isNeutralized ? [
                    { t: '--:--', event: 'Operator authorized: simulation-only neutralization', color: '#22c55e' },
                    { t: '--:--', event: 'Communication-stress model activated', color: '#06b6d4' },
                  ] : []),
                  ...(isNeutralized ? [
                    { t: '--:--', event: 'FPS below threshold — TARGET TERMINATED in simulation', color: '#22c55e' },
                  ] : []),
                ].map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-600 font-mono flex-shrink-0 w-10">{e.t}</span>
                    <span style={{ color: e.color }}>{e.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isNeutralized && (
        <div className="flex justify-end">
          <button onClick={() => { generateReport(); onNavigate('report') }}
            className="px-6 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
            Generate Evidence Report →
          </button>
        </div>
      )}

      {/* Authorization modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0d1b2e] border-2 border-amber-500/50 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-white font-bold text-lg mb-1">Authorize simulation-only neutralization?</h3>
              <p className="text-slate-400 text-sm">This action initiates a software-only communication-stress model. No physical output will be generated.</p>
            </div>
            <div className="mb-6 p-3 rounded border border-amber-500/30 bg-amber-500/5">
              <div className="text-amber-400 text-xs font-semibold mb-1">Scenario assumptions:</div>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>• Detection confidence: {Math.round(confidence * 100)}% (threshold: 65%)</li>
                <li>• Coupling model: normalized, non-operational</li>
                <li>• Expected FPS degradation: 30 → ~18 fps (simulated)</li>
                <li>• No real emitter will be activated</li>
              </ul>
            </div>
            <div className="mb-4 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-center">
              <span className="text-amber-400 text-xs font-bold">Simulation Mode · No Physical Output</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className="flex-1 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors">
                Confirm — Run Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
