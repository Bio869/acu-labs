import type React from 'react'
import type { NavTab } from '../types'
import { useScenario } from '../context/ScenarioContext'
import { SimBadge } from './SimBadge'

const TABS: { id: NavTab; label: string; step: string }[] = [
  { id: 'dashboard',      label: 'Mission Dashboard',      step: '1' },
  { id: 'acoustic',       label: 'Acoustic Analysis',      step: '2' },
  { id: 'geometry',       label: 'Sensor Geometry',        step: '3' },
  { id: 'coupling',       label: 'Fiber Coupling Science', step: '4' },
  { id: 'neutralization', label: 'Simulated Neutralization', step: '5' },
  { id: 'report',         label: 'Evidence Report',        step: '6' },
]

interface NavBarProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  soundControl?: React.ReactNode
}

export function NavBar({ activeTab, onTabChange, soundControl }: NavBarProps) {
  const { state } = useScenario()

  return (
    <header className="flex flex-col bg-[#0a1628] border-b border-[#1e3a5f]">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-sm font-bold">FS</div>
            <div>
              <div className="text-white font-bold text-sm tracking-wider">FiberSentry Acoustic</div>
              <div className="text-slate-400 text-xs">ACU-LABS · C-UAS Research Demo</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {state.phase !== 'idle' && <SimBadge />}
          {soundControl}
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-xs">Scenario ID</div>
          <div className="text-cyan-400 text-xs font-mono">fiber-acoustic-demo-01</div>
        </div>
      </div>
      <nav className="flex px-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all
              ${activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }
            `}
          >
            <span className={`w-4 h-4 rounded-full text-center leading-4 text-[10px] font-bold
              ${activeTab === tab.id ? 'bg-cyan-400 text-navy' : 'bg-slate-700 text-slate-400'}`}>
              {tab.step}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
