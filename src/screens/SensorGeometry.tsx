import { useScenario } from '../context/ScenarioContext'
import { PhaseLabel } from '../components/SimBadge'
import type { NavTab } from '../types'

const NODES = [
  { id: 'N1', name: 'Alpha', cx: 90,  cy: 390, color: '#3b82f6', bearing: 42 },
  { id: 'N2', name: 'Bravo', cx: 410, cy: 390, color: '#f97316', bearing: 312 },
  { id: 'N3', name: 'Charlie', cx: 410, cy: 110, color: '#22c55e', bearing: 218 },
  { id: 'N4', name: 'Delta', cx: 90,  cy: 110, color: '#ef4444', bearing: 135 },
]

const TRACK_X = 270
const TRACK_Y = 240
const ZONE_CX = 250
const ZONE_CY = 250
const ZONE_R = 155

function SensorMapSVG({ phase, sensorsConfirmed }: { phase: string; sensorsConfirmed: number }) {
  const localizing = ['localizing', 'classified', 'awaiting_auth', 'simulating', 'neutralized', 'reported'].includes(phase)
  const detecting = ['detecting', ...['localizing', 'classified', 'awaiting_auth', 'simulating', 'neutralized', 'reported']].includes(phase)

  return (
    <svg viewBox="0 0 500 500" className="w-full h-full" style={{ background: '#060d1b' }}>
      {/* Grid */}
      {Array.from({ length: 11 }, (_, i) => i * 50).map(v => (
        <g key={v}>
          <line x1={v} y1="0" x2={v} y2="500" stroke="#0d2040" strokeWidth="0.5" />
          <line x1="0" y1={v} x2="500" y2={v} stroke="#0d2040" strokeWidth="0.5" />
        </g>
      ))}

      {/* Protected zone */}
      <circle cx={ZONE_CX} cy={ZONE_CY} r={ZONE_R} fill="rgba(30,64,128,0.08)" stroke="#1e4080" strokeWidth="1.5" strokeDasharray="8 4" />
      <circle cx={ZONE_CX} cy={ZONE_CY} r="4" fill="#1e4080" />
      <text x={ZONE_CX} y={ZONE_CY + ZONE_R + 18} fill="#1e4080" fontSize="10" textAnchor="middle" fontFamily="monospace">PROTECTED ZONE</text>

      {/* Bearing lines */}
      {NODES.map((n, i) => {
        const show = localizing ? true : detecting && i === 0
        if (!show) return null
        return (
          <line key={n.id}
            x1={n.cx} y1={n.cy}
            x2={TRACK_X} y2={TRACK_Y}
            stroke={n.color} strokeWidth={2} strokeDasharray="6 4" opacity="0.7"
          />
        )
      })}

      {/* Uncertainty ellipse */}
      {localizing && (
        <ellipse cx={TRACK_X} cy={TRACK_Y} rx="38" ry="26"
          fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
      )}

      {/* Estimated track */}
      {detecting && (
        <g>
          <line x1={TRACK_X - 10} y1={TRACK_Y - 10} x2={TRACK_X + 10} y2={TRACK_Y + 10} stroke="#f59e0b" strokeWidth="2.5" />
          <line x1={TRACK_X + 10} y1={TRACK_Y - 10} x2={TRACK_X - 10} y2={TRACK_Y + 10} stroke="#f59e0b" strokeWidth="2.5" />
          <text x={TRACK_X + 18} y={TRACK_Y - 8} fill="#f59e0b" fontSize="9" fontFamily="monospace">EST. TRACK</text>
          <text x={TRACK_X + 18} y={TRACK_Y + 4} fill="#f59e0b" fontSize="9" fontFamily="monospace">±18m</text>
        </g>
      )}

      {/* Sensor nodes */}
      {NODES.map((n, i) => {
        const confirmed = sensorsConfirmed > i
        return (
          <g key={n.id}>
            {confirmed && (
              <circle cx={n.cx} cy={n.cy} r="20" fill="none" stroke={n.color} strokeWidth="1" opacity="0.25" />
            )}
            <circle cx={n.cx} cy={n.cy} r="10" fill={confirmed ? n.color : '#1e293b'} stroke={n.color} strokeWidth="1.5" />
            <text x={n.cx} y={n.cy + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace">{n.id}</text>
            <text x={n.cx} y={n.cy + 24} fill={n.color} fontSize="9" textAnchor="middle" fontFamily="monospace">{n.name}</text>
            {localizing && (
              <text x={n.cx} y={n.cy + 36} fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">{n.bearing}°</text>
            )}
          </g>
        )
      })}

      {/* Legend */}
      <g transform="translate(10, 460)">
        <rect x="0" y="0" width="6" height="6" fill="none" stroke="#f59e0b" strokeDasharray="3 2" />
        <text x="10" y="6" fill="#94a3b8" fontSize="8" fontFamily="monospace">Uncertainty ellipse (±18m radius)</text>
      </g>
      <g transform="translate(10, 475)">
        <line x1="0" y1="3" x2="12" y2="3" stroke="#3b82f6" strokeDasharray="4 2" strokeWidth="1.5" />
        <text x="16" y="6" fill="#94a3b8" fontSize="8" fontFamily="monospace">Bearing line (node → estimated track)</text>
      </g>
    </svg>
  )
}

interface Props { onNavigate: (tab: NavTab) => void }

export default function SensorGeometry({ onNavigate }: Props) {
  const { state } = useScenario()
  const { phase, sensorsConfirmed, confidence } = state

  const localizing = ['localizing', 'classified', 'awaiting_auth', 'simulating', 'neutralized', 'reported'].includes(phase)

  const nodeAgreement = NODES.map((n, i) => ({
    ...n,
    confirmed: sensorsConfirmed > i,
    snr: sensorsConfirmed > i ? (12 + i * 1.5 + Math.sin(i) * 2).toFixed(1) : '—',
    bearing: sensorsConfirmed > i ? `${n.bearing}° ± 4°` : '—',
  }))

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Sensor Geometry</h2>
          <p className="text-slate-400 text-xs">Multi-node acoustic localization — bearing lines, uncertainty ellipse, track estimate</p>
        </div>
        <PhaseLabel phase={phase} />
      </div>

      {/* Geometry explanation */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 py-3">
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="text-cyan-400 font-semibold">Localization principle: </span>
          Four distributed acoustic nodes (N1–N4) detect bearing from angle-of-arrival differences.
          With {sensorsConfirmed} node{sensorsConfirmed !== 1 ? 's' : ''} confirmed, the system can
          {sensorsConfirmed < 2 ? ' detect only — no triangulation.' : sensorsConfirmed < 3 ? ' estimate a rough cross-bearing with high ambiguity.' : ` triangulate an estimated track with ${sensorsConfirmed === 4 ? 'high' : 'moderate'} confidence.`}
          {' '}Four nodes improve angle diversity and reduce blind spots.
        </div>
      </div>

      <div className="flex gap-4 flex-1">
        {/* Map */}
        <div className="flex-1 rounded-lg border border-[#1e3a5f] overflow-hidden" style={{ minHeight: 420 }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a5f] bg-[#0a1628]">
            <span className="text-cyan-400 text-xs font-semibold tracking-wider">MULTI-NODE ACOUSTIC LOCALIZATION GEOMETRY</span>
          </div>
          <div style={{ height: 420 }}>
            <SensorMapSVG phase={phase} sensorsConfirmed={sensorsConfirmed} />
          </div>
          <div className="px-3 py-1.5 border-t border-[#1e3a5f] bg-[#0a1628]">
            <p className="text-slate-500 text-xs text-center">Four distributed nodes improve angle diversity and reduce blind spots.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-3">
          {/* Localization estimate */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">LOCALIZATION ESTIMATE</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between py-1.5 border-b border-[#1e3a5f]">
                <span className="text-slate-400 text-xs">Estimated Range</span>
                <span className="text-white text-xs font-mono">{localizing ? '120 m ± 18 m' : '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e3a5f]">
                <span className="text-slate-400 text-xs">Bearing</span>
                <span className="text-white text-xs font-mono">{localizing ? '042° ± 5°' : '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e3a5f]">
                <span className="text-slate-400 text-xs">Uncertainty Radius</span>
                <span className="text-white text-xs font-mono">{localizing ? '18 m' : '—'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 text-xs">Node Agreement Score</span>
                <span className="text-white text-xs font-mono">{localizing ? `${Math.round(confidence * 98)}%` : '—'}</span>
              </div>
            </div>
          </div>

          {/* Node status table */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4 flex-1">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">NODE AGREEMENT PANEL</div>
            <div className="flex flex-col gap-3">
              {nodeAgreement.map(n => (
                <div key={n.id} className={`p-2.5 rounded border ${n.confirmed ? 'border-[#1e3a5f]' : 'border-[#0f2240] opacity-40'} bg-[#060d1b]`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                      <span className="text-xs font-mono font-bold" style={{ color: n.color }}>{n.id} {n.name}</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${n.confirmed ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-600'}`}>
                      {n.confirmed ? 'CONFIRMED' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Bearing: <span className="text-white font-mono">{n.bearing}</span></span>
                    <span className="text-slate-500">SNR: <span className="text-white font-mono">{n.snr} dB</span></span>
                  </div>
                  {n.confirmed && (
                    <div className="mt-1.5 h-1 rounded-full bg-[#1e3a5f] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${60 + Math.random() * 35}%`, backgroundColor: n.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => onNavigate('coupling')}
            className="w-full py-2.5 rounded border border-cyan-600 text-cyan-400 text-sm font-semibold hover:bg-cyan-600/10 transition-colors">
            Next: Fiber Coupling Science →
          </button>
        </div>
      </div>
    </div>
  )
}
