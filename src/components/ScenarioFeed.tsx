import { useScenario } from '../context/ScenarioContext'

type FeedKind = 'SYSTEM' | 'SCIENCE' | 'DETECT' | 'LOCALIZE' | 'CLASSIFY' | 'AWAIT' | 'AUTH' | 'EMITTER' | 'SIM' | 'TERM'

interface FeedEntry {
  triggerElapsed?: number      // fires when elapsed >= this
  authOffset?: number          // fires when authorized AND elapsed >= authTime + this
  kind: FeedKind
  text: string
}

const KIND_COLOR: Record<FeedKind, string> = {
  SYSTEM:   '#64748b',
  SCIENCE:  '#06b6d4',
  DETECT:   '#f59e0b',
  LOCALIZE: '#f59e0b',
  CLASSIFY: '#ef4444',
  AWAIT:    '#ef4444',
  AUTH:     '#22c55e',
  EMITTER:  '#f97316',
  SIM:      '#8b5cf6',
  TERM:     '#10b981',
}

const FEED: FeedEntry[] = [
  { triggerElapsed: 0,  kind: 'SYSTEM',  text: 'Kiryat Shmona sector armed. Nodes N1–N4 online — dual-mode (passive RX / phased TX).' },
  { triggerElapsed: 1,  kind: 'SYSTEM',  text: 'Ambient SPL across N1–N4: −58 dBFS. Wind 2.1 m/s — below false-alarm gate.' },

  { triggerElapsed: 2,  kind: 'DETECT',  text: 'Novelty on N3 (NE perimeter): 152 Hz tonal rising, +9 dB above floor.' },
  { triggerElapsed: 3,  kind: 'DETECT',  text: 'N3 harmonic comb 152 / 304 / 456 / 608 Hz. Multi-rotor signature gate ON.' },
  { triggerElapsed: 4,  kind: 'SCIENCE', text: 'TRK-001: 152 Hz ÷ 2-blade × 60 = 4560 RPM — small-quad UAS envelope.' },
  { triggerElapsed: 5,  kind: 'DETECT',  text: 'N2 (SE) crosses 152 Hz threshold. Two-node corroboration on TRK-001.' },

  { triggerElapsed: 7,  kind: 'LOCALIZE', text: 'TDoA(N3→N2): Δt = 174 ms → 59.7 m path differential at c = 343 m/s.' },
  { triggerElapsed: 9,  kind: 'LOCALIZE', text: 'N4 (NW) + N1 (SW) join. 4/4 nodes coherent — uncertainty 14 × 9 m.' },
  { triggerElapsed: 10, kind: 'SCIENCE',  text: 'GCC-PHAT peak SNR on N3–N2: 18 dB. Sub-sample timing locked at ~21 µs.' },

  { triggerElapsed: 11, kind: 'CLASSIFY', text: 'AM-on-tonal + comb spacing match FO-class UAS template (Pcorr = 0.81).' },
  { triggerElapsed: 12, kind: 'CLASSIFY', text: 'RF sweep along bearing: null at 433/915 MHz + 2.4/5.8 GHz — fiber-tether confirmed.' },
  { triggerElapsed: 13, kind: 'CLASSIFY', text: 'TRK-001 locked: SUSPECTED FO-UAS. Confidence 78 %. Range to perimeter 60 m.' },

  { authOffset: 0,  kind: 'AUTH',    text: 'Engagement authorized. Audit token issued.' },
  { authOffset: 1,  kind: 'EMITTER', text: 'N1–N4 switching RX → TX. Beamformer aligning per-node delays on TRK-001.' },
  { authOffset: 2,  kind: 'EMITTER', text: 'Phased array ACTIVE (modeled): 18.3 kHz primary + 22 kHz comb. Wavefronts coherent at target.' },
  { authOffset: 3,  kind: 'SCIENCE', text: 'Coherent summation: 4-node array gives +12 dB SPL gain at TRK-001 vs single emitter.' },
  { authOffset: 4,  kind: 'SIM',     text: 'TRK-001 FPS 30 → 22. Link quality 92 → 65 %. Frames dropping.' },
  { authOffset: 5,  kind: 'SIM',     text: 'FPS 19, link 60 %. Command margin collapsing.' },
  { authOffset: 6,  kind: 'TERM',    text: '◈ TARGET TERMINATED. CAUSE: phased acoustic energy at airframe resonance → IMU gyro loss → control failure. TRK-001 frozen at last fix.' },
  { authOffset: 7,  kind: 'SYSTEM',  text: 'Array returned to passive RX. Simulation halted. No physical output was generated.' },
]

interface FeedRow extends FeedEntry { t: number }

function formatTime(t: number): string {
  const mm = Math.floor(t / 60).toString().padStart(2, '0')
  const ss = Math.floor(t % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export function ScenarioFeed() {
  const { state } = useScenario()
  const { elapsed, authTime } = state

  const visible: FeedRow[] = []
  for (const e of FEED) {
    if (e.triggerElapsed !== undefined) {
      if (elapsed >= e.triggerElapsed) visible.push({ ...e, t: e.triggerElapsed })
    } else if (e.authOffset !== undefined) {
      if (authTime !== null && elapsed >= authTime + e.authOffset) {
        visible.push({ ...e, t: authTime + e.authOffset })
      }
    }
  }

  // newest at top
  visible.sort((a, b) => b.t - a.t)

  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-cyan-400 text-xs font-semibold tracking-wider">SCENARIO FEED — TELEMETRY & SCIENCE</span>
        <span className="text-slate-500 text-[10px] font-mono">{visible.length} entries</span>
      </div>
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {visible.length === 0 && (
          <div className="text-slate-600 text-xs italic">Awaiting scenario start…</div>
        )}
        {visible.map((e, i) => {
          const color = KIND_COLOR[e.kind]
          const isNewest = i === 0
          const isTerm   = e.kind === 'TERM'
          return (
            <div
              key={`${e.t}-${e.kind}`}
              className={`border-l-2 pl-2 py-1 text-[11px] leading-snug ${isTerm ? 'border-l-4' : ''}`}
              style={{
                borderColor: color,
                background: isTerm ? 'rgba(16, 185, 129, 0.18)' : isNewest ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                animation: isNewest ? 'feedSlideIn 0.6s ease-out' : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-500 text-[10px]">{formatTime(e.t)}</span>
                <span className="font-mono font-bold text-[9px] tracking-wider" style={{ color }}>{e.kind}</span>
              </div>
              <div className="text-slate-300 mt-0.5">{e.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
