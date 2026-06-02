import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { useScenario } from '../context/ScenarioContext'
import type { ThreatData } from '../types'

const LAB_PLAN = [
  { id: 1, q: 'Does airborne sound create measurable vibration in the fiber spool or mount?', m: 'Calibrated microphone + accelerometer or laser vibrometer' },
  { id: 2, q: 'Does that vibration create measurable optical perturbation?', m: 'DAS, coherent optical sensing, or suitable fiber sensing module' },
  { id: 3, q: 'Does winding around a resonant body amplify coupling?', m: 'Compare straight fiber, wound fiber, and resonant fixture' },
  { id: 4, q: 'Which frequency regions couple most strongly in the fixture?', m: 'Safe frequency sweep with SPL and vibration recorded' },
  { id: 5, q: 'Is there correlation between SPL, vibration, and optical noise?', m: 'Time-synchronized DAQ and correlation/coherence analysis' },
  { id: 6, q: 'Can a closed benign link show quality stress?', m: 'Closed test link with FPS, packet quality, latency, and error metrics' },
]

function buildReport(state: ReturnType<typeof useScenario>['state']): ThreatData {
  return {
    threat_id: 'T-001',
    scenario_id: 'fiber-acoustic-demo-01',
    operator: 'ACU-LABS Demo Operator',
    timestamp: new Date().toISOString(),
    threat_type: 'suspected_fiber_optic_drone',
    mode: 'simulation_only',
    detection: {
      confidence: +state.confidence.toFixed(3),
      sensors_confirmed: state.sensorsConfirmed,
      snr_db_normalized: +state.snrDb.toFixed(1),
      harmonic_match: +state.harmonicMatch.toFixed(3),
    },
    localization: {
      estimated_range_m: 120,
      bearing_deg: 42,
      uncertainty_radius_m: 18,
    },
    coupling_model: {
      coupling_risk: state.couplingScore > 0.6 ? 'elevated' : 'moderate',
      resonance_match: +state.resonanceMatch.toFixed(3),
      link_margin_stress: +(state.couplingScore * 0.9).toFixed(3),
    },
    neutralization_simulation: {
      authorized_by_user: state.neutralizationAuthorized,
      fps_before: 30,
      fps_after: +state.fps.toFixed(1),
      status: state.phase === 'neutralized' || state.phase === 'reported' ? 'neutralized_in_simulation' : 'pending',
    },
    lab_validation_plan: LAB_PLAN.map(l => `${l.q} — Method: ${l.m}`),
    safety_declaration: 'SIMULATION ONLY — No physical output generated. This report is non-operational. Any real C-UAS activity or field deployment requires specialist legal, aviation, safety, and site authorization review.',
  }
}

function buildTimelineChartData() {
  const data = []
  for (let t = 0; t <= 120; t += 3) {
    const conf = t < 20 ? 5 : Math.min(86, Math.round(86 / (1 + Math.exp(-0.15 * (t - 42)))))
    const fps = t < 75 ? 30 : Math.max(18, 30 - 12 * (1 - Math.exp(-(t - 75) / 8)))
    data.push({ t, confidence: conf, fps: +fps.toFixed(1), threshold: 65, fpsThreshold: 20 })
  }
  return data
}

const TIMELINE = [
  { t: '0:00', event: 'Scenario initialized', phase: 'monitoring', color: '#6b7280' },
  { t: '0:18', event: 'Acoustic anomaly detected — wind distractor rejected (false positive)', phase: 'detecting', color: '#f59e0b' },
  { t: '0:42', event: 'Multi-node localization: 3/4 nodes confirmed. Bearing 042° ± 5°. Range 120m ± 18m', phase: 'localizing', color: '#f59e0b' },
  { t: '1:02', event: 'Threat classified: Suspected fiber-optic drone (RF-silent hypothesis)', phase: 'classified', color: '#ef4444' },
  { t: '1:12', event: 'Coupling analysis: Risk Elevated (74%). Resonance match 68%', phase: 'awaiting_auth', color: '#ef4444' },
  { t: '1:15', event: 'Operator authorized: simulation-only neutralization', phase: 'simulating', color: '#22c55e' },
  { t: '1:30', event: 'FPS degraded: 30 → 18 fps (below 20 fps threshold)', phase: 'simulating', color: '#06b6d4' },
  { t: '1:50', event: 'TARGET TERMINATED in simulation — link quality: 60%', phase: 'neutralized', color: '#22c55e' },
  { t: '2:00', event: 'Evidence report generated — non-operational output', phase: 'reported', color: '#6b7280' },
]

export default function ReportView() {
  const { state } = useScenario()
  const report = buildReport(state)
  const chartData = buildTimelineChartData()

  const isComplete = state.phase === 'neutralized' || state.phase === 'reported'

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fibersentry-report-${report.threat_id}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Evidence Report</h2>
          <p className="text-slate-400 text-xs">Non-operational output — ACU-LABS FiberSentry Acoustic Demo</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded border border-slate-600 text-slate-400 text-xs font-semibold">
            Non-Operational Output
          </span>
          <button onClick={downloadJSON}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
            ↓ Export JSON
          </button>
        </div>
      </div>

      {/* Report header */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div><div className="text-slate-500">Threat ID</div><div className="text-white font-mono">{report.threat_id}</div></div>
          <div><div className="text-slate-500">Scenario ID</div><div className="text-white font-mono">{report.scenario_id}</div></div>
          <div><div className="text-slate-500">Mode</div><div className="text-amber-400 font-mono font-bold">SIMULATION ONLY</div></div>
          <div><div className="text-slate-500">Generated</div><div className="text-white font-mono">{new Date().toLocaleString()}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Metrics summary */}
        <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
          <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">KEY METRICS SUMMARY</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Detection Confidence', value: `${Math.round(state.confidence * 100)}%`, color: '#00d4ff', note: 'Threshold: 65%' },
              { label: 'Nodes Confirmed', value: `${state.sensorsConfirmed}/4`, color: '#3b82f6', note: '3+ for localization' },
              { label: 'Normalized SNR', value: `${state.snrDb.toFixed(1)} dB`, color: '#22c55e', note: 'Simulated input' },
              { label: 'Harmonic Match', value: `${(state.harmonicMatch * 100).toFixed(0)}%`, color: '#8b5cf6', note: 'BPF pattern' },
              { label: 'Est. Range', value: '120 m', color: '#f59e0b', note: '± 18m uncertainty' },
              { label: 'Bearing', value: '042°', color: '#f59e0b', note: '± 5°' },
              { label: 'Coupling Risk', value: `${(state.couplingScore * 100).toFixed(0)}%`, color: '#ef4444', note: 'Elevated' },
              { label: 'FPS After Sim', value: `${state.fps.toFixed(1)} fps`, color: isComplete ? '#ef4444' : '#94a3b8', note: 'Below 20 fps threshold' },
            ].map(m => (
              <div key={m.label} className="p-2 rounded border border-[#1e3a5f] bg-[#060d1b]">
                <div className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-slate-400 text-xs mt-0.5">{m.label}</div>
                <div className="text-slate-600 text-xs">{m.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
          <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">
            DEMO SIMULATION — Confidence & Link Quality
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 15, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 9 }}
                label={{ value: 'Demo time (s)', position: 'insideBottom', offset: -8, fill: '#6b7280', fontSize: 9 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 4, fontSize: 10 }}
                labelStyle={{ color: '#94a3b8' }} />
              <Legend wrapperStyle={{ fontSize: 9, color: '#94a3b8', paddingTop: 8 }} />
              <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="confidence" stroke="#00d4ff" strokeWidth={2} dot={false} name="Detection confidence (%)" />
              <Line type="monotone" dataKey="fps" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="6 3" name="Simulated video FPS" />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-slate-600 text-xs text-center italic mt-1">
            Modeled communication quality degraded below operational threshold in the scenario.
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
        <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">SENSOR TIMELINE</div>
        <div className="relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-[#1e3a5f]" />
          <div className="flex flex-col gap-3">
            {TIMELINE.map((e, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-slate-600 font-mono text-xs w-12 flex-shrink-0 text-right pt-1">{e.t}</span>
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 z-10 border-2"
                  style={{ backgroundColor: e.color + '30', borderColor: e.color }} />
                <div className="flex-1 text-xs" style={{ color: e.color }}>{e.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lab validation plan */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1b2e] p-4">
        <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-3">LAB VALIDATION BRIDGE — Next Steps</div>
        <div className="grid grid-cols-2 gap-3">
          {LAB_PLAN.map(l => (
            <div key={l.id} className="p-3 rounded border border-[#1e3a5f] bg-[#060d1b]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs flex-shrink-0 font-bold">{l.id}</span>
                <div>
                  <div className="text-white text-xs mb-1">{l.q}</div>
                  <div className="text-slate-500 text-xs">Method: {l.m}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety declaration */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="text-amber-400 text-xs font-bold mb-1">SAFETY DECLARATION — Non-Operational Output</div>
        <div className="text-slate-400 text-xs leading-relaxed">{report.safety_declaration}</div>
      </div>

      {/* JSON preview */}
      <div className="rounded-lg border border-[#1e3a5f] bg-[#060d1b] p-4">
        <div className="text-cyan-400 text-xs font-semibold tracking-wider mb-2">REPORT DATA SCHEMA (JSON)</div>
        <pre className="text-xs text-slate-400 font-mono overflow-x-auto leading-relaxed" style={{ maxHeight: 300 }}>
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    </div>
  )
}
