export type ScenarioPhase =
  | 'idle'
  | 'monitoring'
  | 'detecting'
  | 'localizing'
  | 'classified'
  | 'awaiting_auth'
  | 'simulating'
  | 'neutralized'
  | 'reported'

export interface ScenarioState {
  phase: ScenarioPhase
  elapsed: number
  isPaused: boolean
  confidence: number
  snrDb: number
  harmonicMatch: number
  fps: number
  linkQuality: number
  couplingScore: number
  resonanceMatch: number
  sensorsConfirmed: number
  neutralizationAuthorized: boolean
  authTime: number | null
  reportGenerated: boolean
}

export type NavTab =
  | 'dashboard'
  | 'acoustic'
  | 'geometry'
  | 'coupling'
  | 'neutralization'
  | 'report'

export interface ThreatData {
  threat_id: string
  scenario_id: string
  operator: string
  timestamp: string
  threat_type: string
  mode: string
  detection: {
    confidence: number
    sensors_confirmed: number
    snr_db_normalized: number
    harmonic_match: number
  }
  localization: {
    estimated_range_m: number
    bearing_deg: number
    uncertainty_radius_m: number
  }
  coupling_model: {
    coupling_risk: string
    resonance_match: number
    link_margin_stress: number
  }
  neutralization_simulation: {
    authorized_by_user: boolean
    fps_before: number
    fps_after: number
    status: string
  }
  lab_validation_plan: string[]
  safety_declaration: string
}
