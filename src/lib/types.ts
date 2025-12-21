import { Database } from './supabase/types'

export type UserRole = 'operator' | 'approver' | 'admin'
export type ProjectRole = 'owner' | 'editor' | 'viewer'
export type TeamRole = 'team_admin' | 'team_member'

export interface UserNotificationPreferences {
  projectUpdates: boolean
  teamInvites?: boolean
}

export interface UserProfile {
  id: string
  email?: string
  role: UserRole
  avatarUrl?: string | null // Added
  emailNotificationPreferences?: UserNotificationPreferences
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  email?: string // Hydrated from auth/user_profile join
  avatarUrl?: string | null // Added
  role: ProjectRole
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  logoUrl?: string | null
  role?: ProjectRole // Current user's role in this project
  tanks: Tank[]
}

export interface Tank {
  id: string
  tag: string
  productionField: string // Name for display
  productionFieldId: string // ID for logic
  wellName?: string // Name for display
  wellId?: string // ID for logic
  geolocation: string
  sheets: Sheet[]
}

export interface ProductionField {
  id: string
  name: string
  projectId?: string | null
}

export interface Well {
  id: string
  name: string
  productionFieldId: string
}

export interface TransferDestinationCategory {
  id: string
  name: string
  projectId: string
}

export interface Sheet {
  id: string
  name: string
  type: 'production' | 'calibration' | 'seal' | 'reports'
}

export interface ProductionRow {
  id: string
  A_Data: string // datetime
  B_Altura_Liq_Inicial_mm: number | string
  C_Volume_Inicial_m3: number | string // calc
  D_Data_fim_periodo: string // datetime (PK)
  E_Altura_Liq_Final_mm: number | string
  F_Volume_Final_m3: number | string // calc
  G_Diferenca_volumes: number | string // calc
  H_Volume_Corrigido_24h: number | string // calc
  I_Estoque_QT_m3: number | string // mixed
  J_Volume_Drenado_Agua_m3: number | string
  K_Transferencia_Emulsao: number | string
  L_Prod_Total_QT_m3_d: number | string // calc
  M_Prod_Agua_Livre_QWF_m3_d: number | string // calc
  N_Estoque_Agua_Livre_QWF_m3: number | string // mixed
  O_Prod_Emulsao_QEM_m3_d: number | string // calc
  P_Prod_Oleo_Sem_Correcao_m3_d: number | string // calc
  Q_Prod_Oleo_Corrigido_m3_d: number | string // mixed
  R_Agua_Emulsao_m3_d: number | string // calc
  S_Agua_Total_Produzida_m3_d: number | string // calc
  T_BSW_Total_Calculado: number | string // calc
  U_BSW_Total_Perc: number | string
  V_BSW_Emulsao_Perc: number | string
  W_Temp_Ambiente: number | string
  X_Temp_Fluido: number | string
  Y_Dilatacao_Termica: number | string // calc
  Z_Densidade_Lab_20C: number | string // mixed
  AA_T_Observada_C: number | string // calc
  AB_FCV: number | string // calc (auto or manual)
  AB_FCV_Manual?: number | string // Manual override storage
  AC_Fator_Encolhimento_FE: number | string // default 1.0
  AD_Vol_Bruto_Transf_Emulsao: number | string // calc
  AE_Vol_Agua_Transf: number | string // calc
  AF_Vol_Oleo_Transf_Sem_Corr: number | string // calc
  AG_Vol_Oleo_Transf_Com_Corr: number | string // calc
  AH_Referencia: number | string // calc
}

export interface ProductionChartItem {
  tank_id: string
  date: string
  well_production: number
  drained: number
  transferred: number
  water_production: number
  uncorrected_oil_production: number
  total_bsw_percent: number
}

export interface CalibrationRow {
  id: string
  altura_mm: number
  volume_m3: number
  fcv?: number
}

export interface SealRow {
  id: string
  tanque: string
  data: string
  hora: string
  situacao: string
  valvula_entrada_1: string
  lacre_entrada_1: string
  valvula_dreno: string
  lacre_dreno: string
  valvula_saida: string
}

export interface AuditLog {
  id: string
  userId: string
  projectId?: string
  entityType:
    | 'tank'
    | 'calibration'
    | 'production_field'
    | 'well'
    | 'calibration_table'
    | 'operation'
    | 'report'
    | 'transfer_category'
    | 'alert_rule'
    | 'user'
    | 'project'
    | 'project_member'
    | 'team'
    | 'team_member'
    | 'project_team_role'
  entityId: string
  operationType:
    | 'update_tank_tag'
    | 'update_tank_production_field'
    | 'update_tank_well'
    | 'update_calibration'
    | 'import_calibration'
    | 'insert'
    | 'delete'
    | 'update'
    | 'batch_update'
    | 'close_report'
    | 'create_user'
    | 'delete_user'
    | 'update_user_role'
    | 'update_project_logo'
    | 'add_member'
    | 'remove_member'
    | 'update_member_role'
    | 'create_team'
    | 'update_team'
    | 'delete_team'
    | 'add_team_member'
    | 'remove_team_member'
    | 'update_team_member_role'
    | 'assign_team_to_project'
    | 'remove_team_from_project'
    | 'update_project_team_role'
  oldValue?: string
  newValue?: string
  reason: string
  createdAt: string
}

export interface BatchCalibrationOperations {
  inserts: Omit<CalibrationRow, 'id'>[]
  updates: CalibrationRow[]
  deletes: string[]
}

export type OperationType =
  | 'production'
  | 'drainage'
  | 'transfer'
  | 'stock_variation'

export interface TankOperation {
  id: string
  tankId: string
  type: OperationType
  startTime: string
  endTime: string

  // Levels
  initialLevelMm: number
  finalLevelMm: number

  // Calculated Volumes
  initialVolumeM3?: number
  finalVolumeM3?: number
  volumeM3?: number // Net volume change

  // Measurements
  tempFluidC?: number
  tempAmbientC?: number
  densityObservedGcm3?: number
  bswPercent?: number

  // Calculated Corrections
  ctl?: number
  fcv?: number // NEW: Volume Correction Factor
  fe?: number // NEW: Shrinkage Factor (Fator de Encolhimento)
  volumeCorrectedM3?: number
  waterVolumeM3?: number
  oilVolumeM3?: number

  // NEW: Transfer Destination
  transferDestination?: string

  dailyReportId?: string // Link to Daily Report

  comments?: string
  createdAt?: string
  userId?: string
}

export interface DailyProductionReport {
  id: string
  tankId: string
  reportDate: string
  startDatetime: string
  endDatetime: string

  // Metrics
  stockVariation: number
  totalBswPercent: number
  drainedVolumeM3: number
  transferredVolumeM3: number
  uncorrectedOilVolumeM3: number
  emulsionWaterVolumeM3: number
  tempCorrectionFactorY: number
  correctedOilVolumeM3: number
  emulsionBswPercent: number
  fluidTempC: number
  fcv: number
  fe: number
  densityAt20cGcm3?: number
  transferObservedDensityGcm3?: number // NEW
  calculatedWellProductionM3: number

  status: 'draft' | 'closed'
  createdAt: string
  closedAt?: string
  closedBy?: string
}

export interface AlertRule {
  id: string
  projectId: string
  userId: string
  name: string
  metricField: string
  condition: 'gt' | 'lt' | 'eq' | 'neq'
  thresholdValue: number
  createdAt: string
  updatedAt: string
}

export interface AlertNotification {
  id: string
  alertRuleId: string
  dailyReportId: string
  triggeredAt: string
  message: string
  isRead: boolean
  alertRule?: AlertRule
  dailyReport?: DailyProductionReport
}

export interface Team {
  id: string
  name: string
  ownerUserId: string
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  email?: string
  avatarUrl?: string | null // Added
  createdAt: string
  updatedAt: string
}

export interface ProjectTeamRole {
  id: string
  projectId: string
  teamId: string
  role: ProjectRole
  teamName?: string
  createdAt: string
  updatedAt: string
}
