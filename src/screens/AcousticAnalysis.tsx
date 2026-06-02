import { useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useScenario } from '../context/ScenarioContext'
import { PhaseLabel } from '../components/SimBadge'
import type { NavTab } from '../types'

const BINS = 64
const COLS = 220

function toColor(v: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [0, 5, 40],
    [0, 30, 140],
    [0, 140, 180],
    [20, 200, 80],
    [200, 220, 0],
    [255, 80, 0],
  ]
  const idx = v * (stops.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(stops.length - 1, lo + 1)
  const t = idx - lo
  return stops[lo].map((c, i) => Math.round(c + t * (stops[hi][i] - c))) as [number, number, number]
}

function useSpectrogram(phase: string, canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const bufRef = useRef<number[][]>(
    Array.from({ length: COLS }, () => Array.from({ length: BINS }, () => Math.random() * 0.18))
  )
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDrone = ['detecting', 'localizing', 'classified', 'awaiting_auth', 'simulating', 'neutralized', 'reported'].includes(phase)
    const strength = phase === 'detecting' ? 0.45 : 0.75

    const render = () => {
      tickRef.current++
      if (tickRef.current % 3 === 0) {
        const col: number[] = Array.from({ length: BINS }, (_, f) => {
          let v = (Math.random() * 0.18) + Math.sin(f * 0.3 + tickRef.current * 0.05) * 0.03
          if (isDrone) {
            const harmonics = [5, 10, 15, 20, 25, 30]
            for (const h of harmonics) {
              const dist = f - h
              v += strength * Math.exp(-(dist * dist) / 0.8) * (1 - (h / 35) * 0.4)
            }
          }
          return Math.min(1, Math.max(0, v))
        })
        bufRef.current.shift()
        bufRef.current.push(col)
      }

      const cellW = canvas.width / COLS
      const cellH = canvas.height / BINS
      for (let t = 0; t < COLS; t++) {
        for (let f = 0; f < BINS; f++) {
          const val = bufRef.current[t][f]
          const [r, g, b] = toColor(val)
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(t * cellW, (BINS - 1 - f) * cellH, cellW + 0.5, cellH + 0.5)
        }
      }

      // Harmonic annotations
      if (isDrone) {
        ctx.strokeStyle = 'rgba(255, 220, 0, 0.5)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        const harmonics = [5, 10, 15, 20, 25]
        for (const h of harmonics) {
          const y = (BINS - 1 - h) * cellH + cellH / 2
          ctx.beginPath()
          ctx.moveTo(COLS * cellW * 0.6, y)
          ctx.lineTo(COLS * cellW, y)
          ctx.stroke()
        }
        ctx.setLineDash([])
        const labels = ['~310 Hz BPF', '~620 Hz 2H', '~930 Hz 3H', '~1240 Hz 4H', '~1550 Hz 5H']
        ctx.fillStyle = 'rgba(255,220,0,0.7)'
        ctx.font = '9px monospace'
        harmonics.forEach((h, i) => {
          const y = (BINS - 1 - h) * cellH + cellH / 2 + 3
          ctx.fillText(labels[i], 2, y)
        })
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, canvasRef])
}

function buildChartData(elapsed: number, confidence: number) {
  const data = []
  for (let t = 0; t <= Math.min(elapsed, 90); t += 2) {
    const c = t < 20 ? 5 + Math.sin(t) * 2 : Math.min(86, Math.round(86 / (1 + Math.exp(-0.15 * (t - 42)))))
    const isFP = t >= 8 && t <= 14
    data.push({
      t: `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`,
      confidence: c,
      threshold: 65,
      fp: isFP ? c : null,
    })
  }
  return data
}

const REASON_CODES = [
  { id: 'HARM', label: 'Harmonic Match', active: true, desc: 'Rotor blade-pass frequency harmonics detected at 310 Hz intervals' },
  { id: 'PERS', label: 'Signal Persistence', active: true, desc: 'Acoustic signature sustained >18 seconds across multiple frames' },
  { id: 'MNODE', label: 'Multi-Node Agreement', active: true, desc: '3/4 acoustic nodes report consistent bearing and SNR' },
  { id: 'MCOH', label: 'Motion Consistency', active: true, desc: 'Doppler-consistent frequency shift detected on approach vector' },
]

interface Props { onNavigate: (tab: NavTab) => void }

export default function AcousticAnalysis({ onNavigate }: Props) {
  const { state } = useScenario()
  const { phase, elapsed, confidence, harmonicMatch, snrDb } = state
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useSpectrogram(phase, canvasRef as React.RefObject<HTMLCanvasElement | null>)

  const detecting = ['detecting', 'localizing', 'classified', 'awaiting_auth', 'simulating', 'neutralized', 'reported'].includes(phase)
  const chartData = buildChartData(elapsed, confidence)

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Acoustic Analysis</h2>
          <p className="text-slate-400 text-xs">Passive microphone array — spectrogram + classifier output</p>
        </div>
        <PhaseLabel phase={phase} />
      </div>

      {/* Alert card */}
      {detecting && (
        <div className="rounded-lg border border-amber-600/40 bg-amber-500/5 px-4 py-3 flex items-center gap-4">
          <span className="text-2xl blink">⚠️</span>
          <div>
            <div className="text-amber-400 font-bold text-sm">Drone-like acoustic anomaly detected</div>
            <div className="text-slate-400 text-xs mt-0.5">Harmonic pattern consistent with multi-rotor UAS blade-pass frequency. See spectrogram and reason codes below.</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-white font-bold text-xl">{Math.round(confidence * 100)}%</div>
            <div className="text-slate-400 text-xs">Confidence</div>
          </div>
        </div>
      )}

      {/* False positive event */}
      {(phase === 'monitoring' || elapsed < 18) && (
        <div className="rounded-lg border border-green-800/40 bg-green-900/5 px-4 py-3 flex items-center gap-3">
          <span className="text-green-400 text-lg">✓</span>
          <div>
            <div className="text-green-400 font-semibold text-sm">Non-threat event: wind turbulence detected at t=8s</div>
            <div className="text-slate-400 text-xs">Broadband noise event. Confidence did not exceed escalation threshold (65%). Classifier rejected: no harmonic structure, short persistence, single-node.</div>
          </div>
        </div>
      )}

      {/* Spectrogram */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#060d1b] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3a5f] bg-[#0a1628]">
          <span className="text-cyan-400 text-xs font-semibold tracking-wider">ACOUSTIC SPECTROGRAM — Frequency vs Time</span>
          <span className="text-slate-500 text-xs">Passive detection · Simulated input</span>
        </div>
        <div className="flex gap-0">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-right pr-2 py-1" style={{ width: 60, height: 220 }}>
            {['4000', '3000', '2000', '1000', '500', '0'].map(f => (
              <span key={f} className="text-slate-600 font-mono" style={{ fontSize: 9 }}>{f}Hz</span>
            ))}
          </div>
          <div className="flex-1 relative" style={{ height: 220 }}>
            <canvas ref={canvasRef} width={880} height={220}
              className="w-full h-full" style={{ display: 'block' }} />
          </div>
          {/* Color bar */}
          <div className="flex flex-col w-6 ml-1" style={{ height: 220 }}>
            <div className="flex-1 rounded"
              style={{ background: 'linear-gradient(to top, rgb(0,5,40), rgb(0,30,140), rgb(0,140,180), rgb(20,200,80), rgb(200,220,0), rgb(255,80,0))' }} />
            <div className="flex flex-col justify-between text-right" style={{ height: 220 }}>
              <span className="text-slate-600 font-mono" style={{ fontSize: 8 }}>MAX</span>
              <span className="text-slate-600 font-mono" style={{ fontSize: 8 }}>0</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between px-16 py-1 border-t border-[#1e3a5f]">
          <span className="text-slate-600 text-xs font-mono">t-44s</span>
          <span className="text-slate-500 text-xs font-mono">← TIME →</span>
          <span className="text-cyan-400 text-xs font-mono">NOW</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Confidence trend chart */}
        <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
          <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">DETECTION CONFIDENCE TREND</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 4 }}
                labelStyle={{ color: '#94a3b8', fontSize: 10 }}
                itemStyle={{ fontSize: 10 }}
              />
              <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Escalation', fill: '#f59e0b', fontSize: 9 }} />
              <Line type="monotone" dataKey="confidence" stroke="#00d4ff" strokeWidth={2} dot={false} name="Confidence %" />
              <Line type="monotone" dataKey="fp" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Non-threat event" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Classifier reason codes */}
        <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
          <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">CLASSIFIER EVIDENCE — REASON CODES</div>
          <div className="flex flex-col gap-2.5">
            {REASON_CODES.map(r => (
              <div key={r.id} className={`flex items-start gap-2.5 ${!detecting ? 'opacity-30' : ''}`}>
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5
                  ${detecting ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-slate-800 text-slate-600'}`}>
                  {detecting ? '✓' : '·'}
                </div>
                <div>
                  <div className="text-white text-xs font-semibold">{r.label}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#1e3a5f] grid grid-cols-2 gap-2 text-xs">
            <div><div className="text-slate-500">Harmonic Match</div><div className="text-white font-mono">{(harmonicMatch * 100).toFixed(0)}%</div></div>
            <div><div className="text-slate-500">Normalized SNR</div><div className="text-white font-mono">{snrDb.toFixed(1)} dB</div></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => onNavigate('geometry')}
          className="px-6 py-2.5 rounded border border-cyan-600 text-cyan-400 text-sm font-semibold hover:bg-cyan-600/10 transition-colors">
          Next: Sensor Geometry →
        </button>
      </div>
    </div>
  )
}
