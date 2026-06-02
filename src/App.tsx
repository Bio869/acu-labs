import { useState } from 'react'
import { ScenarioProvider } from './context/ScenarioContext'
import { NavBar } from './components/NavBar'
import { SoundManager } from './components/SoundManager'
import MissionDashboard from './screens/MissionDashboard'
import AcousticAnalysis from './screens/AcousticAnalysis'
import SensorGeometry from './screens/SensorGeometry'
import FiberCouplingScience from './screens/FiberCouplingScience'
import SimulatedNeutralization from './screens/SimulatedNeutralization'
import ReportView from './screens/ReportView'
import type { NavTab } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')

  return (
    <ScenarioProvider>
      <div className="flex flex-col h-screen bg-[#060d1b] overflow-hidden">
        <NavBar activeTab={activeTab} onTabChange={setActiveTab} soundControl={<SoundManager />} />
        <main className="flex-1 overflow-hidden">
          {activeTab === 'dashboard'      && <div className="h-full overflow-y-auto"><MissionDashboard onNavigate={setActiveTab} /></div>}
          {activeTab === 'acoustic'       && <div className="h-full overflow-y-auto"><AcousticAnalysis onNavigate={setActiveTab} /></div>}
          {activeTab === 'geometry'       && <div className="h-full overflow-y-auto"><SensorGeometry onNavigate={setActiveTab} /></div>}
          {activeTab === 'coupling'       && <div className="h-full overflow-y-auto"><FiberCouplingScience onNavigate={setActiveTab} /></div>}
          {activeTab === 'neutralization' && <div className="h-full overflow-y-auto"><SimulatedNeutralization onNavigate={setActiveTab} /></div>}
          {activeTab === 'report'         && <div className="h-full overflow-y-auto"><ReportView /></div>}
        </main>
      </div>
    </ScenarioProvider>
  )
}
