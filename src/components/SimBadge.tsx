export function SimBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border border-amber-500/60 bg-amber-500/10 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-amber-400 blink" />
      <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">
        Simulation Mode · No Physical Output
      </span>
    </div>
  )
}

export function PhaseLabel({ phase }: { phase: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    idle:          { text: 'System Ready', color: 'text-slate-400 border-slate-600' },
    monitoring:    { text: 'Monitoring — No Threat', color: 'text-green-400 border-green-700' },
    detecting:     { text: 'Acoustic Anomaly Detected', color: 'text-amber-400 border-amber-600' },
    localizing:    { text: 'Localizing — Multi-Node', color: 'text-amber-400 border-amber-600' },
    classified:    { text: 'Threat Classified', color: 'text-red-400 border-red-700' },
    awaiting_auth: { text: 'Human Authorization Required', color: 'text-red-400 border-red-700 blink' },
    simulating:    { text: 'Simulation Running — No Physical Emitter Active', color: 'text-cyan-400 border-cyan-700' },
    neutralized:   { text: 'TARGET TERMINATED in Simulation', color: 'text-green-400 border-green-700' },
    reported:      { text: 'Non-Operational Output Generated', color: 'text-slate-400 border-slate-600' },
  }
  const l = labels[phase] ?? labels['idle']
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded border text-xs font-semibold tracking-wide ${l.color}`}>
      {l.text}
    </span>
  )
}
