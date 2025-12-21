import { ProductionRow, SealRow } from './types'

export interface DbProject {
  id: string
  name: string
  description: string | null
  // user_id: string | null -- Removed in previous migration
  created_by: string | null // Added in 20251218150000 migration
  logo_url: string | null
  created_at: string
  updated_at: string | null
}

export interface DbProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface DbProductionField {
  id: string
  name: string
  project_id: string | null
  created_at: string
  updated_at: string | null
}

export interface DbWell {
  id: string
  name: string
  production_field_id: string
  created_at: string
  updated_at: string | null
}

export interface DbTransferDestinationCategory {
  id: string
  name: string
  project_id: string
  created_at: string
  updated_at: string | null
}

export interface DbTank {
  id: string
  project_id: string
  tag: string
  production_field_id: string
  well_id: string | null
  geolocation: string | null
  created_at: string
  updated_at: string | null
  // Joined fields
  production_field?: DbProductionField
  well?: DbWell
}

export interface DbProductionData {
  id: string
  tank_id: string
  date: string | null
  gross_production: number | null
  total_water_production: number | null
  uncorrected_oil_production: number | null
  corrected_oil_production: number | null
  raw_data: ProductionRow
  created_at: string
}

export interface DbCalibrationData {
  id: string
  tank_id: string
  height_mm: number
  volume_m3: number
  fcv: number | null
  created_at: string
}

export interface DbSealData {
  id: string
  tank_id: string
  date: string | null
  raw_data: SealRow
  created_at: string
}

export interface DbAuditLog {
  id: string
  user_id: string
  project_id: string | null
  entity_type: string
  entity_id: string
  operation_type: string
  old_value: string | null
  new_value: string | null
  reason: string
  created_at: string
}

export interface DbDailyProductionReport {
  id: string
  tank_id: string
  report_date: string
  start_datetime: string
  end_datetime: string
  stock_variation: number | null
  total_bsw_percent: number | null
  drained_volume_m3: number | null
  transferred_volume_m3: number | null
  uncorrected_oil_volume_m3: number | null
  emulsion_water_volume_m3: number | null
  temp_correction_factor_y: number | null
  corrected_oil_volume_m3: number | null
  emulsion_bsw_percent: number | null
  fluid_temp_c: number | null
  fcv: number | null
  fe: number | null
  density_at_20c_gcm3: number | null
  transfer_observed_density_gcm3: number | null
  calculated_well_production_m3: number | null
  status: string
  created_at: string
  updated_at: string | null
  closed_at: string | null
  closed_by: string | null
}

export interface DbAlertRule {
  id: string
  project_id: string
  user_id: string
  name: string
  metric_field: string
  condition: string
  threshold_value: number
  created_at: string
  updated_at: string
}

export interface DbAlertNotification {
  id: string
  alert_rule_id: string
  daily_report_id: string
  triggered_at: string
  message: string
  is_read: boolean
}

export interface DbFcvCalculationLog {
  id: string
  user_id: string
  calculated_at: string
  fluid_temp_c: number
  observed_density_gcm3: number
  density_at_20c_gcm3: number
  fcv: number
  reference_base: string
  pressure_kpag: number
  applied_norm: string
  algorithm_version: string
}

export interface DbUserProfile {
  id: string
  role: 'operator' | 'approver' | 'admin'
  email_notification_preferences: any // JSONB
  created_at: string
  updated_at: string
}

export interface DbAppSettings {
  key: string
  value: string
  updated_at: string
  updated_by: string | null
}

export interface DbTeam {
  id: string
  name: string
  owner_user_id: string
  created_at: string
  updated_at: string
}

export interface DbTeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'team_admin' | 'team_member'
  created_at: string
  updated_at: string
}

export interface DbProjectTeamRole {
  id: string
  project_id: string
  team_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}
