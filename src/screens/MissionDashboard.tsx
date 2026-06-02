import { useScenario } from '../context/ScenarioContext'
import { PhaseLabel } from '../components/SimBadge'
import { ScenarioFeed } from '../components/ScenarioFeed'
import type { NavTab } from '../types'

const NODE_POSITIONS = [
  { id: 'N1', cx: 130, cy: 330, color: '#3b82f6', label: 'N1', name: 'Node Alpha' },
  { id: 'N2', cx: 470, cy: 330, color: '#f97316', label: 'N2', name: 'Node Bravo' },
  { id: 'N3', cx: 470, cy: 80,  color: '#22c55e', label: 'N3', name: 'Node Charlie' },
  { id: 'N4', cx: 130, cy: 80,  color: '#ef4444', label: 'N4', name: 'Node Delta' },
]

const DRONE_START = { x: 540, y: 50 }

// Protected zone center in SVG and real-world coordinates
const ZONE_CX = 300, ZONE_CY = 210

// Drone moves toward zone center along a straight bearing with slight wobble.
// Speed tuned so the UAS is still inbound (inside the zone, off-center NE)
// at termination (t=20s) instead of hovering on a cap.
const DRONE_SPEED_PX_S = 14.0  // px (≈ m) per second
const DRONE_T0          = 2    // seconds — start moving

function computeDronePos(elapsed: number, phase: string, authTime: number | null) {
  const isEliminated   = phase === 'neutralized' || phase === 'reported'
  const eliminationT   = authTime !== null ? authTime + 6 : Infinity
  const effElapsed     = isEliminated ? Math.min(elapsed, eliminationT) : elapsed
  const moveTime       = Math.max(0, effElapsed - DRONE_T0)

  // Unit vector from start → zone center
  const dx0   = ZONE_CX - DRONE_START.x
  const dy0   = ZONE_CY - DRONE_START.y
  const dist0 = Math.hypot(dx0, dy0)
  const ux    = dx0 / dist0
  const uy    = dy0 / dist0

  // Base position along straight line at constant speed.
  // No tight cap — drone keeps moving toward zone all the way through
  // termination, freezing wherever it is at eliminationT. Cap is just a
  // safety so it can't fly past the SW edge of the map in long runs.
  const maxTravel = dist0 + 80
  const travelled = Math.min(moveTime * DRONE_SPEED_PX_S, maxTravel)
  const baseX    = DRONE_START.x + ux * travelled
  const baseY    = DRONE_START.y + uy * travelled

  // Perpendicular axis for lateral wobble (slight direction change)
  const px = -uy
  const py =  ux
  const wobble = (Math.sin(effElapsed * 0.55) * 6) + (Math.sin(effElapsed * 1.37 + 0.7) * 2.4)

  return {
    x: baseX + px * wobble,
    y: baseY + py * wobble,
    eliminated: isEliminated && elapsed >= eliminationT,
  }
}
// Northern border sector — protected zone centered on Kiryat Shmona, Upper Galilee
const BASE_LAT = 33.2074    // 33°12'26.6"N
const BASE_LON = 35.5697    //  35°34'10.9"E
const M_PER_PX  = 1.0       // 1 SVG unit = 1 meter
const DEG_PER_M_LAT = 0.000008998
const DEG_PER_M_LON = 0.000010743  // at 33.2°N

// Directional landmark sign-posts around the perimeter — Northern border context
const CITY_LABELS: { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end'; color?: string }[] = [
  { x: 300, y: 14,  text: '↑  METULA  9 km',              anchor: 'middle' },
  { x: 595, y: 105, text: 'MT. HERMON  22 km  →',         anchor: 'end'    },
  { x: 595, y: 295, text: 'ROSH PINA  14 km  ↘',          anchor: 'end'    },
  { x: 300, y: 394, text: '↓  SAFED  28 km',              anchor: 'middle' },
  { x: 8,   y: 295, text: '↙  NAHARIYA  50 km',           anchor: 'start'  },
  { x: 8,   y: 105, text: '↖  LEBANON BORDER  2 km',      anchor: 'start',  color: '#7c2d12' },
]

function toDMS(deg: number, isLat: boolean): string {
  const abs = Math.abs(deg)
  const d   = Math.floor(abs)
  const mFull = (abs - d) * 60
  const m   = Math.floor(mFull)
  const s   = ((mFull - m) * 60).toFixed(2).padStart(5, '0')
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  return `${d}°${m.toString().padStart(2, '0')}'${s}"${dir}`
}

function getDroneData(droneX: number, droneY: number, elapsed: number, eliminated: boolean) {
  const dx = (droneX - ZONE_CX) * M_PER_PX   // +East
  const dy = (ZONE_CY - droneY) * M_PER_PX   // +North (SVG y inverted)

  // Realistic GPS noise: ~1.5m accuracy (freezes on elimination)
  const noiseT = eliminated ? 0 : elapsed
  const nLat = Math.sin(noiseT * 7.31) * 0.000013 + Math.cos(noiseT * 13.7) * 0.000006
  const nLon = Math.cos(noiseT * 5.17) * 0.000015 + Math.sin(noiseT * 9.4)  * 0.000007

  const lat  = BASE_LAT + dy * DEG_PER_M_LAT + nLat
  const lon  = BASE_LON + dx * DEG_PER_M_LON + nLon
  // Altitude descends linearly with travel distance from start
  const fracTravelled = Math.min(1, Math.hypot(droneX - DRONE_START.x, droneY - DRONE_START.y) / Math.hypot(ZONE_CX - DRONE_START.x, ZONE_CY - DRONE_START.y))
  const alt  = eliminated ? 0 : Math.round(85 - fracTravelled * 43 + Math.sin(elapsed * 2.9) * 2.5)
  const spd  = eliminated ? '0.0' : (9.5 + Math.sin(elapsed * 2.3) * 0.9).toFixed(1)
  const hdg  = Math.round(222 + Math.sin(elapsed * 1.7) * 4)
  const acc  = (1.8 + Math.abs(Math.sin(elapsed * 4.1)) * 1.2).toFixed(1)
  const dist = Math.round(Math.sqrt((droneX - ZONE_CX) ** 2 + (droneY - ZONE_CY) ** 2))

  return { lat, lon, alt, spd, hdg, acc, dist }
}

function CoordHUD({ droneX, droneY, data, eliminated }: {
  droneX: number; droneY: number
  data: ReturnType<typeof getDroneData>
  eliminated: boolean
}) {
  const { lat, lon, alt, spd, hdg, acc, dist } = data
  const latStr = toDMS(lat, true)
  const lonStr = toDMS(lon, false)

  // Anchor HUD to the left of drone when in right half, right when in left half
  const hLeft = droneX > 330
  const hx = hLeft ? droneX - 192 : droneX + 16
  const hy = droneY - 72

  const urgentColor = eliminated ? '#10b981' : (dist < 140 ? '#ef4444' : '#f59e0b')
  const trackLabel  = eliminated ? '◈ TRK-001  TARGET TERMINATED' : '◈ TRK-001  SUSPECTED UAS'

  return (
    <g>
      {/* connector line to drone */}
      <line x1={droneX} y1={droneY} x2={hLeft ? hx + 190 : hx} y2={hy + 35}
        stroke={urgentColor} strokeWidth="0.7" strokeDasharray="3 2" opacity="0.6" />

      {/* HUD box */}
      <rect x={hx - 2} y={hy - 4} width={192} height={82} rx="2"
        fill="rgba(2,8,20,0.88)" stroke={urgentColor} strokeWidth="0.9" />

      {/* header bar */}
      <rect x={hx - 2} y={hy - 4} width={192} height={14} rx="2"
        fill={urgentColor + '28'} />
      <text x={hx + 4} y={hy + 6} fill={urgentColor} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
        {trackLabel}
      </text>

      {/* lat / lon */}
      <text x={hx + 4} y={hy + 22} fill="#00d4ff" fontSize="9" fontFamily="monospace">{latStr}</text>
      <text x={hx + 4} y={hy + 34} fill="#00d4ff" fontSize="9" fontFamily="monospace">{lonStr}</text>

      {/* Alt / speed / heading */}
      <text x={hx + 4} y={hy + 48} fill="#e2e8f0" fontSize="8" fontFamily="monospace">
        {`ALT: ${alt}m AGL   SPD: ${spd} m/s`}
      </text>
      <text x={hx + 4} y={hy + 60} fill="#e2e8f0" fontSize="8" fontFamily="monospace">
        {eliminated ? `STATE: TERMINATED   RNG: ${dist}m` : `HDG: ${hdg}°   ACC: ±${acc}m   RNG: ${dist}m`}
      </text>

      {/* blinking indicator dot */}
      <circle cx={hx + 180} cy={hy + 6} r="3" fill={urgentColor} className="blink" />
    </g>
  )
}

function TacticalMap({ elapsed, phase, authTime }: { elapsed: number; phase: string; authTime: number | null }) {
  const active    = phase !== 'idle'
  const detecting = ['detecting','localizing','classified','awaiting_auth','simulating','neutralized','reported'].includes(phase)
  const pos = computeDronePos(elapsed, phase, authTime)
  const droneX = pos.x
  const droneY = pos.y
  const eliminated = pos.eliminated
  const droneData = getDroneData(droneX, droneY, elapsed, eliminated)

  const gridLines: React.ReactNode[] = []
  for (let x = 0; x <= 600; x += 50) gridLines.push(<line key={`v${x}`} x1={x} y1="0" x2={x} y2="400" stroke="#0d2040" strokeWidth="1" />)
  for (let y = 0; y <= 400; y += 50) gridLines.push(<line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#0d2040" strokeWidth="1" />)

  return (
    <svg viewBox="0 0 600 400" className="w-full h-full" style={{ background: '#060d1b' }}>
      {gridLines}

      {/* Compass */}
      <text x="580" y="20" fill="#1e3a5f" fontSize="10" textAnchor="middle" fontFamily="monospace">N</text>
      <text x="580" y="390" fill="#1e3a5f" fontSize="10" textAnchor="middle" fontFamily="monospace">S</text>
      <text x="15" y="205" fill="#1e3a5f" fontSize="10" textAnchor="middle" fontFamily="monospace">W</text>
      <text x="588" y="205" fill="#1e3a5f" fontSize="10" textAnchor="middle" fontFamily="monospace">E</text>

      {/* Northern border directional landmarks */}
      {CITY_LABELS.map((c, i) => (
        <text key={`city-${i}`} x={c.x} y={c.y} fill={c.color ?? '#2a4a78'}
          fontSize="9" textAnchor={c.anchor} fontFamily="monospace" fontWeight="bold">{c.text}</text>
      ))}
      <text x="300" y="28" fill="#1e3a5f" fontSize="8" textAnchor="middle"
        fontFamily="monospace" letterSpacing="1">UPPER GALILEE · NORTHERN BORDER SECTOR</text>

      {/* Protected zone — Kiryat Shmona */}
      <circle cx="300" cy="210" r="130" fill="none" stroke="#1e4080" strokeWidth="1.5" strokeDasharray="6 4" />
      <circle cx="300" cy="210" r="6" fill="#1e4080" />
      <text x="300" y="355" fill="#1e4080" fontSize="10" textAnchor="middle" fontFamily="monospace">PROTECTED ZONE — KIRYAT SHMONA · 260 m radius</text>

      {/* Distance rings */}
      {detecting && (
        <>
          <circle cx="300" cy="210" r="65" fill="none" stroke="#1e3050" strokeWidth="0.8" strokeDasharray="3 5" />
          <text x="367" y="212" fill="#1e3050" fontSize="7" fontFamily="monospace">65m</text>
        </>
      )}

      {/* Bearing lines — each node points at the live track */}
      {detecting && !eliminated && NODE_POSITIONS.map(n => (
        <line key={n.id} x1={n.cx} y1={n.cy} x2={droneX} y2={droneY}
          stroke={n.color} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
      ))}

      {/* Uncertainty ellipse — follows track, shrinks as more nodes confirm */}
      {detecting && !eliminated && (() => {
        const stage = phase === 'detecting' ? 0 : phase === 'localizing' ? 1 : 2
        const rx = stage === 0 ? 30 : stage === 1 ? 18 : 9
        const ry = stage === 0 ? 22 : stage === 1 ? 13 : 6
        return (
          <ellipse cx={droneX} cy={droneY} rx={rx} ry={ry}
            fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
        )
      })()}

      {/* Sensor nodes */}
      {NODE_POSITIONS.map(n => (
        <g key={n.id}>
          <circle cx={n.cx} cy={n.cy} r="9" fill={n.color} opacity="0.9" />
          <text x={n.cx} y={n.cy + 22} fill={n.color} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{n.id}</text>
        </g>
      ))}

      {/* Phased acoustic array — N1..N4 fire converging beams during 'simulating' */}
      {active && phase === 'simulating' && !eliminated && (
        <g>
          {NODE_POSITIONS.map(n => (
            <g key={`beam-${n.id}`}>
              {/* Static beam line from node to target */}
              <line x1={n.cx} y1={n.cy} x2={droneX} y2={droneY}
                stroke={n.color} strokeWidth="1.6" opacity="0.75" />
              {/* TX badge above node */}
              <text x={n.cx} y={n.cy - 16} fill={n.color}
                fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">▲ TX</text>
            </g>
          ))}
          {/* Array label */}
          <text x={300} y={398} fill="#fb923c" fontSize="9" textAnchor="middle"
            fontFamily="monospace" fontWeight="bold">◉ N1–N4 PHASED ACOUSTIC ARRAY · BEAMFORMING ON TARGET (SIM)</text>
        </g>
      )}

      {/* Drone + trail */}
      {active && (
        <g>
          {detecting && (
            <line x1={DRONE_START.x} y1={DRONE_START.y} x2={droneX} y2={droneY}
              stroke={eliminated ? '#10b981' : '#f59e0b'} strokeWidth="1" opacity="0.35" />
          )}

          {/* Drone body */}
          <polygon
            points={`${droneX},${droneY - 11} ${droneX + 8},${droneY + 7} ${droneX - 8},${droneY + 7}`}
            fill={eliminated ? '#475569' : (detecting ? '#ef4444' : '#94a3b8')}
            opacity={eliminated ? 0.5 : 0.95}
            className={!eliminated && detecting ? 'blink' : ''}
          />
          {/* Rotor arms (4 dots) — hidden when eliminated (no spin) */}
          {detecting && !eliminated && (
            <>
              <circle cx={droneX - 6} cy={droneY - 5} r="3" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
              <circle cx={droneX + 6} cy={droneY - 5} r="3" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
              <circle cx={droneX - 6} cy={droneY + 5} r="3" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
              <circle cx={droneX + 6} cy={droneY + 5} r="3" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
            </>
          )}

          {/* TERMINATION marker — text tag only */}
          {eliminated && (
            <g>
              <rect x={droneX - 78} y={droneY + 16} width="156" height="22" rx="3"
                fill="rgba(2,8,20,0.95)" stroke="#10b981" strokeWidth="1.4" />
              <text x={droneX} y={droneY + 31} textAnchor="middle"
                fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
                ◈ TARGET TERMINATED
              </text>
            </g>
          )}

          {/* Coordinate HUD (only when detected) */}
          {detecting && (
            <CoordHUD droneX={droneX} droneY={droneY} data={droneData} eliminated={eliminated} />
          )}
        </g>
      )}

      {/* Estimated track X — follows actual drone position with slight lag */}
      {detecting && !eliminated && (
        <g>
          <line x1={droneX - 10} y1={droneY - 10} x2={droneX + 10} y2={droneY + 10} stroke="#f59e0b" strokeWidth="2.5" opacity="0.55" />
          <line x1={droneX + 10} y1={droneY - 10} x2={droneX - 10} y2={droneY + 10} stroke="#f59e0b" strokeWidth="2.5" opacity="0.55" />
        </g>
      )}

      {/* Scale bar */}
      <line x1="20" y1="380" x2="70" y2="380" stroke="#1e3a5f" strokeWidth="1" />
      <text x="45" y="375" fill="#1e3a5f" fontSize="9" textAnchor="middle" fontFamily="monospace">100m</text>
    </svg>
  )
}

function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const r = 44
  const circ = 2 * Math.PI * r
  const filled = circ * (pct / 100) * 0.75
  const offset = circ * 0.125
  const color = pct < 30 ? '#22c55e' : pct < 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg width="110" height="90" viewBox="0 0 110 90">
      <circle cx="55" cy="65" r={r} fill="none" stroke="#1e3a5f" strokeWidth="8"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={offset} strokeLinecap="round" transform="rotate(135 55 65)" />
      <circle cx="55" cy="65" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={offset} strokeLinecap="round" transform="rotate(135 55 65)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      <text x="55" y="58" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="monospace">{pct}</text>
      <text x="55" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">CONFIDENCE %</text>
    </svg>
  )
}

function TargetTrackerCard({ elapsed, phase, authTime }: { elapsed: number; phase: string; authTime: number | null }) {
  const detecting = ['detecting','localizing','classified','awaiting_auth','simulating','neutralized','reported'].includes(phase)
  if (!detecting) return null

  const pos = computeDronePos(elapsed, phase, authTime)
  const d = getDroneData(pos.x, pos.y, elapsed, pos.eliminated)
  const urgColor = pos.eliminated ? '#10b981' : (d.dist < 140 ? '#ef4444' : '#f59e0b')

  return (
    <div className="rounded-lg border bg-[#060d1b] p-3" style={{ borderColor: urgColor + '60' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-wider" style={{ color: urgColor }}>
          {pos.eliminated ? '◈ TARGET TERMINATED — TRK-001' : '◈ TARGET TRACKER — TRK-001'}
        </span>
        <span className={`w-2 h-2 rounded-full ${pos.eliminated ? '' : 'blink'}`} style={{ backgroundColor: urgColor }} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <div>
          <div className="text-slate-500" style={{ fontSize: 9 }}>LATITUDE</div>
          <div className="text-cyan-300">{toDMS(d.lat, true)}</div>
        </div>
        <div>
          <div className="text-slate-500" style={{ fontSize: 9 }}>LONGITUDE</div>
          <div className="text-cyan-300">{toDMS(d.lon, false)}</div>
        </div>
        <div className="mt-1">
          <div className="text-slate-500" style={{ fontSize: 9 }}>ALT AGL</div>
          <div className="text-white">{d.alt} m</div>
        </div>
        <div className="mt-1">
          <div className="text-slate-500" style={{ fontSize: 9 }}>SPEED</div>
          <div className="text-white">{d.spd} m/s</div>
        </div>
        <div>
          <div className="text-slate-500" style={{ fontSize: 9 }}>HEADING</div>
          <div className="text-white">{d.hdg}°</div>
        </div>
        <div>
          <div className="text-slate-500" style={{ fontSize: 9 }}>RANGE TO ZONE</div>
          <div style={{ color: urgColor }} className="font-bold">{d.dist} m</div>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-[#1e3a5f] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(5, 100 - (d.dist / 300) * 100)}%`,
            backgroundColor: urgColor,
          }} />
      </div>
      <div className="flex justify-between text-xs mt-0.5" style={{ fontSize: 8 }}>
        <span className="text-slate-600">GPS ACC: ±{d.acc}m</span>
        <span style={{ color: urgColor }}>
          {pos.eliminated ? '✓ TARGET TERMINATED' : (d.dist < 130 ? '⚠ INSIDE ZONE' : `${d.dist}m to perimeter`)}
        </span>
      </div>
    </div>
  )
}

interface Props { onNavigate: (tab: NavTab) => void }

export default function MissionDashboard({ onNavigate }: Props) {
  const { state, start, pause, reset } = useScenario()
  const { phase, elapsed, confidence, sensorsConfirmed, snrDb, fps, isPaused, authTime } = state

  const elapsedStr = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${Math.floor(elapsed % 60).toString().padStart(2, '0')}`

  const nodeStatuses = NODE_POSITIONS.map((n, i) => ({
    ...n,
    active: sensorsConfirmed > i,
  }))

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Mission Dashboard</h2>
          <p className="text-slate-400 text-xs">Single pane of glass — passive acoustic monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {isPaused && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-amber-500/60 bg-amber-500/15 text-amber-300 text-xs font-bold tracking-wider blink">
              ⏸ PAUSED
            </span>
          )}
          <PhaseLabel phase={phase} />
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Tactical map */}
        <div className="flex-1 rounded-lg border border-[#1e3a5f] overflow-hidden bg-[#060d1b]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a5f] bg-[#0a1628]">
            <span className="text-cyan-400 text-xs font-semibold tracking-wider">TACTICAL OVERVIEW</span>
            <span className="text-slate-500 text-xs font-mono">{elapsedStr}</span>
          </div>
          <TacticalMap elapsed={elapsed} phase={phase} authTime={authTime} />
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-3 overflow-y-auto">
          {/* Controls */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">SCENARIO CONTROLS</div>
            <div className="flex gap-2">
              {phase === 'idle' ? (
                <button onClick={start}
                  className="flex-1 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
                  ▶ Start Scenario
                </button>
              ) : (
                <>
                  <button onClick={isPaused ? start : pause}
                    className="flex-1 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors">
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button onClick={reset}
                    className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
                    ↺
                  </button>
                </>
              )}
            </div>
            {phase !== 'idle' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Elapsed</span><span className="font-mono text-white">{elapsedStr}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1e3a5f] overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (elapsed / 20) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>


          {/* Confidence gauge */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4 flex flex-col items-center">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-1 self-start">DETECTION CONFIDENCE</div>
            <ConfidenceGauge value={confidence} />
          </div>

          {/* Live target tracker (shows when detecting) */}
          <TargetTrackerCard elapsed={elapsed} phase={phase} authTime={authTime} />

          {/* Rolling scenario feed with science explanations */}
          <ScenarioFeed />

          {/* Node status */}
          <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
            <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">ACOUSTIC NODES</div>
            <div className="flex flex-col gap-2">
              {nodeStatuses.map(n => (
                <div key={n.id} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: n.active ? n.color : '#374151' }} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs font-mono" style={{ color: n.active ? n.color : '#6b7280' }}>{n.id} — {n.name}</span>
                      <span className="text-xs text-slate-500">{n.active ? 'ACTIVE' : 'STANDBY'}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[#1e3a5f] mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: n.active ? '75%' : '5%', backgroundColor: n.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#1e3a5f] grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-slate-500">Nodes Confirmed</div><div className="text-white font-mono">{sensorsConfirmed}/4</div></div>
              <div><div className="text-slate-500">Norm. SNR</div><div className="text-white font-mono">{snrDb.toFixed(1)} dB</div></div>
              <div><div className="text-slate-500">Video FPS</div><div className="text-white font-mono">{fps.toFixed(1)}</div></div>
              <div><div className="text-slate-500">Link Quality</div><div className="text-white font-mono">{Math.round(state.linkQuality * 100)}%</div></div>
            </div>
          </div>

          {phase !== 'idle' && (
            <button onClick={() => onNavigate('acoustic')}
              className="w-full py-2.5 rounded border border-cyan-600 text-cyan-400 text-sm font-semibold hover:bg-cyan-600/10 transition-colors">
              Next: Acoustic Analysis →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
