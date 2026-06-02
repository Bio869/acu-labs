import { useScenario } from '../context/ScenarioContext'
import { PhaseLabel } from '../components/SimBadge'
import type { NavTab } from '../types'

const PATHWAY = [
  {
    id: 'sig',
    icon: '📡',
    title: 'Acoustic Signature',
    detail: 'Rotor blade-pass frequency (~310 Hz) and harmonics detected via passive sensing.',
    color: '#3b82f6',
  },
  {
    id: 'vib',
    icon: '〰️',
    title: 'Structure Vibration',
    detail: 'Airborne sound pressure loads the fiber spool exterior, mount, and enclosure. Coupling improves when fiber is wound around a resonant body.',
    color: '#8b5cf6',
  },
  {
    id: 'strain',
    icon: '🔬',
    title: 'Fiber Strain Response',
    detail: 'Microscopic strain from structural vibration perturbs the optical path length and backscatter characteristics of the fiber core.',
    color: '#06b6d4',
  },
  {
    id: 'optical',
    icon: '💡',
    title: 'Optical Perturbation',
    detail: 'Phase noise and backscatter variations are modeled as a measurable signal — not a guaranteed link failure. Lab validation required.',
    color: '#f59e0b',
  },
  {
    id: 'stress',
    icon: '📉',
    title: 'Simulated Link Stress',
    detail: 'Coupling score is converted to simulated FPS, packet quality, and link-margin stress in the communication model.',
    color: '#ef4444',
  },
]

const ASSUMPTIONS = [
  'Fiber spool is wound (G657A2, Resin/PVC, 15100m) — resonant coupling enhanced',
  'Fiber is mounted on a structure with mechanical compliance',
  'Acoustic pressure reaches exterior of spool/enclosure (range and geometry dependent)',
  'Normalized physics model — not calibrated to this specific spool without lab test',
  'Distance scaling follows inverse-square law (see distance panel)',
]

function CouplingBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-white">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#1e3a5f] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function DistanceScalingChart() {
  const points = [
    { d: 20, effort: 1.0, label: '1x' },
    { d: 50, effort: 6.25, label: '6.25x' },
    { d: 100, effort: 25, label: '25x' },
    { d: 200, effort: 100, label: '100x' },
  ]
  const maxE = 100
  const chartW = 300, chartH = 120
  const padL = 30, padB = 30

  return (
    <div>
      <div className="text-slate-400 text-xs mb-2">Relative source effort for equal target intensity (normalized — 20m = 1x baseline)</div>
      <svg width={chartW} height={chartH + padB} style={{ display: 'block' }}>
        <g transform={`translate(${padL}, 0)`}>
          {/* bars */}
          {points.map((p, i) => {
            const bw = 36
            const x = (i / (points.length - 0.2)) * (chartW - padL - 20)
            const h = (p.effort / maxE) * chartH
            const barColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']
            return (
              <g key={p.d}>
                <rect x={x} y={chartH - h} width={bw} height={h} fill={barColors[i]} opacity="0.8" rx="2" />
                <text x={x + bw / 2} y={chartH - h - 4} fill="#e2e8f0" fontSize="9" textAnchor="middle" fontFamily="monospace">{p.label}</text>
                <text x={x + bw / 2} y={chartH + 16} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="monospace">{p.d}m</text>
              </g>
            )
          })}
          {/* y axis */}
          <line x1="0" y1="0" x2="0" y2={chartH} stroke="#1e3a5f" />
          <line x1="0" y1={chartH} x2={chartW - padL} y2={chartH} stroke="#1e3a5f" />
          <text x="-5" y={chartH} fill="#6b7280" fontSize="8" textAnchor="end" fontFamily="monospace">0</text>
          <text x="-5" y="8" fill="#6b7280" fontSize="8" textAnchor="end" fontFamily="monospace">100x</text>
        </g>
      </svg>
      <div className="mt-1 text-amber-400 text-xs font-semibold">⚠ Normalized simulation outputs only — no absolute watts or equipment designs.</div>
    </div>
  )
}

interface Props { onNavigate: (tab: NavTab) => void }

export default function FiberCouplingScience({ onNavigate }: Props) {
  const { state } = useScenario()
  const { phase, couplingScore, resonanceMatch, confidence } = state

  const classified = ['classified', 'awaiting_auth', 'simulating', 'neutralized', 'reported'].includes(phase)
  const couplingRisk = couplingScore > 0.6 ? 'Elevated' : couplingScore > 0.3 ? 'Moderate' : 'Low'
  const couplingRiskColor = couplingScore > 0.6 ? '#ef4444' : couplingScore > 0.3 ? '#f59e0b' : '#22c55e'

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Fiber Coupling Science</h2>
          <p className="text-slate-400 text-xs">Acoustic-to-fiber coupling model — scientific mechanism and normalized coupling score</p>
        </div>
        <PhaseLabel phase={phase} />
      </div>

      {/* Threat classification */}
      {classified && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-red-400 font-bold text-sm">Threat Classification: Suspected Fiber-Optic Drone</div>
              <div className="text-slate-400 text-xs mt-0.5">
                RF-silent hypothesis: no RF command link detected. Acoustic track consistent with multi-rotor UAS.
                Fiber-linked control path assumed. Classification is a hypothesis — not field-verified.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Coupling pathway */}
        <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
          <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-4">ACOUSTIC-TO-FIBER COUPLING PATHWAY</div>
          <div className="flex flex-col gap-1">
            {PATHWAY.map((p, i) => (
              <div key={p.id}>
                <div className="flex items-start gap-3 p-3 rounded border border-[#1e3a5f] bg-[#060d1b]">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${p.color}20`, border: `1px solid ${p.color}40` }}>
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{p.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{p.detail}</div>
                  </div>
                </div>
                {i < PATHWAY.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <div className="text-slate-600 text-sm">↓</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Fiber spool context */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">FIBER SPOOL CONTEXT — G657A2</div>
            <div className="flex gap-3">
              {/* Stylized spool illustration */}
              <div className="w-24 h-24 rounded border border-[#1e3a5f] flex-shrink-0 flex items-center justify-center bg-[#060d1b] relative overflow-hidden">
                <svg viewBox="0 0 80 80" width="80" height="80">
                  <rect x="10" y="15" width="60" height="50" rx="4" fill="#1a2234" stroke="#374151" strokeWidth="1.5" />
                  <circle cx="40" cy="40" r="22" fill="none" stroke="#f97316" strokeWidth="2" />
                  <circle cx="40" cy="40" r="16" fill="none" stroke="#f97316" strokeWidth="1.5" />
                  <circle cx="40" cy="40" r="10" fill="none" stroke="#f97316" strokeWidth="1" />
                  <circle cx="40" cy="40" r="4" fill="#f97316" />
                  <rect x="8" y="13" width="64" height="8" rx="2" fill="#374151" />
                  <rect x="8" y="59" width="64" height="8" rx="2" fill="#374151" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    ['Version', 'Fiber Optic 3.0'],
                    ['Length', '15,100 m'],
                    ['Weight', '1.4 kg'],
                    ['Material', 'Resin/PVC'],
                    ['Model', 'G657A2'],
                    ['Tension', '> 50N'],
                    ['1310nm loss', '≤ 6 dB'],
                    ['1550nm loss', '≤ 8 dB'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-slate-500" style={{ fontSize: 9 }}>{k}</div>
                      <div className="text-white font-mono" style={{ fontSize: 9 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-amber-400/80 italic">
                  Wound configuration may amplify acoustic coupling via resonance effects
                </div>
              </div>
            </div>
          </div>

          {/* Coupling scores */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">NORMALIZED COUPLING SCORES</div>
            <div className="flex flex-col gap-3 mb-3">
              <CouplingBar value={couplingScore} label="Coupling Risk Score" color="#ef4444" />
              <CouplingBar value={resonanceMatch} label="Resonance Match" color="#f59e0b" />
              <CouplingBar value={confidence} label="Detection Confidence" color="#00d4ff" />
              <CouplingBar value={couplingScore * 0.9} label="Link Margin Stress" color="#8b5cf6" />
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded border"
              style={{ borderColor: couplingRiskColor + '40', backgroundColor: couplingRiskColor + '10' }}>
              <span className="text-xs text-slate-400">Overall Coupling Risk</span>
              <span className="text-sm font-bold" style={{ color: couplingRiskColor }}>{couplingRisk}</span>
            </div>
            <div className="mt-2 text-slate-500 text-xs italic">
              Confidence bands: ±15% (normalized model, lab validation required)
            </div>
          </div>

          {/* Assumptions */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-2">MODEL ASSUMPTIONS</div>
            <div className="flex flex-col gap-1.5">
              {ASSUMPTIONS.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-slate-600 flex-shrink-0 mt-0.5">•</span>
                  <span className="text-slate-400">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Distance scaling */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
        <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">DISTANCE AND INTENSITY SCALING (Normalized Simulation)</div>
        <DistanceScalingChart />
      </div>

      <div className="flex justify-end">
        <button onClick={() => onNavigate('neutralization')}
          className="px-6 py-2.5 rounded border border-cyan-600 text-cyan-400 text-sm font-semibold hover:bg-cyan-600/10 transition-colors">
          Next: Simulated Neutralization →
        </button>
      </div>
    </div>
  )
}
