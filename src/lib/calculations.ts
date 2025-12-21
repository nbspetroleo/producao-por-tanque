import { CalibrationRow, ProductionRow, TankOperation } from './types'
import {
  parseISO,
  isWithinInterval,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  addDays,
} from 'date-fns'
import { calculateCrudeApi11To20 } from './api11_1_crude'
import { INITIAL_PRODUCTION_ROW } from './initialData'

// Helper to get number from string/number, handling commas
const val = (v: number | string | undefined): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') {
    // Replace comma with dot for JS parsing
    const parsed = parseFloat(v.replace(',', '.'))
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const hasVal = (v: number | string | undefined): boolean => {
  if (typeof v === 'number') return true
  if (typeof v === 'string' && v.trim() !== '') return true
  return false
}

export const getProductionDayWindow = (date: Date) => {
  // Calendar day: 00:00:00 to 23:59:59
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export const getReportDateFromTimestamp = (timestamp: Date | string): Date => {
  const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp
  // Calendar day logic: The date itself corresponds to the report date
  // No shifting needed for hours >= 17 as reports align with calendar day
  return date
}

export interface DailyMetrics {
  stockVariation: number
  drained: number
  transferred: number // Gross Transfer Volume
  wellProduction: number

  // Specific metrics from last operations
  fluidTempC: number
  totalBswPercent: number
  emulsionBswPercent: number
  densityAt20cGcm3: number
  transferObservedDensityGcm3: number | null
  fcv: number
  fe: number
  tempCorrectionFactorY: number

  // Well Production Breakdown
  correctedOilVolume: number
  emulsionWaterVolume: number
  uncorrectedOilVolume: number

  // Transfer Operation Specifics (Aggregated)
  transferWaterVolume: number
  transferOilUncorrectedVolume: number
  transferOilCorrectedVolume: number
  transferFluidTemp: number | null
  transferFcv: number
  transferFe: number
  transferFdt: number
  transferBswPercent: number

  // New: Collected destinations
  transferDestinations: string[]
}

export const calculateDailyMetrics = (
  operations: TankOperation[],
): DailyMetrics => {
  // Sort operations by end time (latest first) to easily find last operations
  const sortedByEnd = [...operations].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
  )

  // Sort by start time for accumulation logic (chronological)
  const sortedChronological = [...operations].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )

  let drained = 0
  let transferred = 0
  let productionSum = 0 // Sum of net changes from production operations

  // Transfer specifics accumulation
  let transferWaterSum = 0
  let transferCorrectedOilSum = 0
  const destinations = new Set<string>()

  sortedChronological.forEach((op) => {
    const volM3 = op.volumeM3 || 0
    if (op.type === 'drainage') {
      drained += volM3
    } else if (op.type === 'transfer') {
      transferred += volM3
      // Accumulate specific transfer components
      transferWaterSum += op.waterVolumeM3 || 0
      transferCorrectedOilSum += op.volumeCorrectedM3 || 0
      if (op.transferDestination) {
        destinations.add(op.transferDestination)
      }
    } else if (op.type === 'production' || op.type === 'stock_variation') {
      productionSum += volM3
    }
  })

  // Round accumulated values
  drained = Number(drained.toFixed(4))
  transferred = Number(transferred.toFixed(4))
  productionSum = Number(productionSum.toFixed(4))

  // Transfer specifics calculation
  transferWaterSum = Number(transferWaterSum.toFixed(4))
  transferCorrectedOilSum = Number(transferCorrectedOilSum.toFixed(4))
  // Uncorrected Oil for Transfer = Gross - Water
  const transferOilUncorrectedVolume = Number(
    (transferred - transferWaterSum).toFixed(4),
  )

  // Stock Variation
  const stockVariation = Number(productionSum.toFixed(4))

  // Well Production (Material Balance)
  const wellProduction = Number(
    (stockVariation + drained + transferred).toFixed(4),
  )

  // Find Last Operations for Specific Metrics
  const lastProductionOp = sortedByEnd.find(
    (op) => op.type === 'production' || op.type === 'stock_variation',
  )
  const lastTransferOp = sortedByEnd.find((op) => op.type === 'transfer')

  // Calculate Average Transfer Observed Density
  const transferOps = operations.filter((op) => op.type === 'transfer')
  let transferDensitySum = 0
  let transferDensityCount = 0

  transferOps.forEach((op) => {
    if (
      op.densityObservedGcm3 !== undefined &&
      op.densityObservedGcm3 !== null &&
      op.densityObservedGcm3 > 0
    ) {
      transferDensitySum += op.densityObservedGcm3
      transferDensityCount++
    }
  })

  const transferObservedDensityGcm3 =
    transferDensityCount > 0
      ? Number((transferDensitySum / transferDensityCount).toFixed(4))
      : null

  // Specific Metrics
  const totalBswPercent = lastProductionOp?.bswPercent ?? 0
  const emulsionBswPercent = lastTransferOp?.bswPercent ?? 0
  const densityAt20cGcm3 = lastProductionOp?.densityObservedGcm3 ?? 0 // Using observed as proxy if 20C not available
  const fcv = lastTransferOp?.fcv ?? 1.0
  const fe = lastTransferOp?.fe ?? 1.0

  // Y Factor from Last Transfer Temp (used for calculation)
  // Default to 20C if missing to avoid NaN in factor calculation
  const transferTempForCalc = lastTransferOp?.tempFluidC ?? 20
  const tempCorrectionFactorY = Number(
    (1 + (transferTempForCalc - 20) * 0.000012).toFixed(6),
  )

  const fluidTempC = lastProductionOp?.tempFluidC ?? 0

  // Derived Volumes based on Specific Metrics (WELL PRODUCTION)
  const bswDecimal = totalBswPercent / 100
  const uncorrectedOilVolume = wellProduction * (1 - bswDecimal)
  const emulsionWaterVolume = wellProduction * bswDecimal

  // Corrected Oil using the Specific Factors (WELL PRODUCTION)
  // Corrected = Uncorrected * Y * FCV * FE
  const correctedOilVolume =
    uncorrectedOilVolume * tempCorrectionFactorY * fcv * fe

  return {
    stockVariation,
    drained,
    transferred,
    wellProduction,
    fluidTempC: Number(fluidTempC.toFixed(2)),
    totalBswPercent: Number(totalBswPercent.toFixed(4)),
    emulsionBswPercent: Number(emulsionBswPercent.toFixed(4)),
    densityAt20cGcm3: Number(densityAt20cGcm3.toFixed(4)),
    transferObservedDensityGcm3,
    fcv: Number(fcv.toFixed(6)),
    fe: Number(fe.toFixed(6)),
    tempCorrectionFactorY,
    correctedOilVolume: Number(correctedOilVolume.toFixed(4)),
    emulsionWaterVolume: Number(emulsionWaterVolume.toFixed(4)),
    uncorrectedOilVolume: Number(uncorrectedOilVolume.toFixed(4)),

    // Transfer Specifics
    transferWaterVolume: transferWaterSum,
    transferOilUncorrectedVolume: transferOilUncorrectedVolume,
    transferOilCorrectedVolume: transferCorrectedOilSum,
    // Display value should reflect reality (null if missing)
    transferFluidTemp:
      lastTransferOp?.tempFluidC !== undefined &&
      lastTransferOp?.tempFluidC !== null
        ? Number(lastTransferOp.tempFluidC.toFixed(2))
        : null,
    transferFcv: Number(fcv.toFixed(6)),
    transferFe: Number(fe.toFixed(6)),
    transferFdt: tempCorrectionFactorY,
    transferBswPercent: Number(emulsionBswPercent.toFixed(4)),

    transferDestinations: Array.from(destinations),
  }
}

export const calculateProductionRow = (
  row: ProductionRow,
  prevRow: ProductionRow | undefined,
  calibrationData: CalibrationRow[],
): ProductionRow => {
  const newRow = { ...row }

  // A: Data (Manual or Copy from prev D)
  if (prevRow && !newRow.A_Data) {
    newRow.A_Data = prevRow.D_Data_fim_periodo
  }

  // C: Volume_Inicial_m3 (Calculated from B using Calibration Table)
  if (hasVal(newRow.B_Altura_Liq_Inicial_mm)) {
    const height = val(newRow.B_Altura_Liq_Inicial_mm)
    newRow.C_Volume_Inicial_m3 = lookupCalibrationValue(
      height,
      calibrationData,
      'volume_m3',
    )
  } else {
    newRow.C_Volume_Inicial_m3 = ''
  }

  // F: Volume_Final_m3 (Calculated from E using Calibration Table)
  if (hasVal(newRow.E_Altura_Liq_Final_mm)) {
    const height = val(newRow.E_Altura_Liq_Final_mm)
    newRow.F_Volume_Final_m3 = lookupCalibrationValue(
      height,
      calibrationData,
      'volume_m3',
    )
  } else {
    newRow.F_Volume_Final_m3 = ''
  }

  // G: Diferenca_volumes (F - C)
  if (hasVal(newRow.F_Volume_Final_m3) && hasVal(newRow.C_Volume_Inicial_m3)) {
    const diff = val(newRow.F_Volume_Final_m3) - val(newRow.C_Volume_Inicial_m3)
    newRow.G_Diferenca_volumes = Number(diff.toFixed(4))
  } else {
    newRow.G_Diferenca_volumes = ''
  }

  // J & K: Drained & Transferred (Inputs)
  const J = val(newRow.J_Volume_Drenado_Agua_m3)
  const K = val(newRow.K_Transferencia_Emulsao)

  // H: Volume_Corrigido_24h
  const G = val(newRow.G_Diferenca_volumes)
  const grossProduction = G + J + K

  if (
    hasVal(newRow.G_Diferenca_volumes) &&
    newRow.D_Data_fim_periodo &&
    newRow.A_Data
  ) {
    try {
      const endDate = parseISO(newRow.D_Data_fim_periodo)
      const startDate = parseISO(newRow.A_Data)
      const diffTime = endDate.getTime() - startDate.getTime()
      const hours = Math.abs(diffTime / (1000 * 60 * 60))

      if (hours > 0) {
        const corrected = (grossProduction / hours) * 24
        newRow.H_Volume_Corrigido_24h = Number(corrected.toFixed(4))
      } else {
        newRow.H_Volume_Corrigido_24h = Number(grossProduction.toFixed(4))
      }
    } catch (e) {
      newRow.H_Volume_Corrigido_24h = ''
    }
  } else {
    // Fallback if no dates
    newRow.H_Volume_Corrigido_24h = hasVal(newRow.G_Diferenca_volumes)
      ? Number(grossProduction.toFixed(4))
      : ''
  }

  // I: Estoque_QT_m3 = G(curr) - J(curr) - K(curr) + I(prev)
  const I_prev = prevRow ? val(prevRow.I_Estoque_QT_m3) : 0

  if (hasVal(newRow.G_Diferenca_volumes)) {
    newRow.I_Estoque_QT_m3 = Number((G - J - K + I_prev).toFixed(4))
  } else {
    newRow.I_Estoque_QT_m3 = ''
  }

  // L: Prod_Total_QT_m3_d = H
  newRow.L_Prod_Total_QT_m3_d = newRow.H_Volume_Corrigido_24h

  // M: Prod_Agua_Livre_QWF_m3_d = (1 - U%) * L
  const L = val(newRow.L_Prod_Total_QT_m3_d)
  const U = hasVal(newRow.U_BSW_Total_Perc)
    ? val(newRow.U_BSW_Total_Perc) / 100
    : 0

  if (hasVal(newRow.L_Prod_Total_QT_m3_d) && hasVal(newRow.U_BSW_Total_Perc)) {
    newRow.M_Prod_Agua_Livre_QWF_m3_d = Number((L * (1 - U)).toFixed(4))
  } else {
    newRow.M_Prod_Agua_Livre_QWF_m3_d = ''
  }

  // N: Estoque_Agua_Livre_QWF_m3 = M(curr) + N(prev) - K(curr)
  const M = val(newRow.M_Prod_Agua_Livre_QWF_m3_d)
  const N_prev = prevRow ? val(prevRow.N_Estoque_Agua_Livre_QWF_m3) : 0

  if (hasVal(newRow.M_Prod_Agua_Livre_QWF_m3_d)) {
    newRow.N_Estoque_Agua_Livre_QWF_m3 = Number((M + N_prev - K).toFixed(4))
  } else {
    newRow.N_Estoque_Agua_Livre_QWF_m3 = ''
  }

  // O: Prod_Emulsao_QEM_m3_d = L - M
  if (
    hasVal(newRow.L_Prod_Total_QT_m3_d) &&
    hasVal(newRow.M_Prod_Agua_Livre_QWF_m3_d)
  ) {
    newRow.O_Prod_Emulsao_QEM_m3_d = Number((L - M).toFixed(4))
  } else {
    newRow.O_Prod_Emulsao_QEM_m3_d = ''
  }

  // P: Prod_Oleo_Sem_Correcao_m3_d = O * (1 - V%)
  const O = val(newRow.O_Prod_Emulsao_QEM_m3_d)
  const V = hasVal(newRow.V_BSW_Emulsao_Perc)
    ? val(newRow.V_BSW_Emulsao_Perc) / 100
    : 0

  if (
    hasVal(newRow.O_Prod_Emulsao_QEM_m3_d) &&
    hasVal(newRow.V_BSW_Emulsao_Perc)
  ) {
    newRow.P_Prod_Oleo_Sem_Correcao_m3_d = Number((O * (1 - V)).toFixed(4))
  } else {
    newRow.P_Prod_Oleo_Sem_Correcao_m3_d = ''
  }

  // Y: Dilatacao_Termica = 1 + (X - 20) * 0.000012
  if (hasVal(newRow.W_Temp_Ambiente) && hasVal(newRow.X_Temp_Fluido)) {
    const X = val(newRow.X_Temp_Fluido)
    newRow.Y_Dilatacao_Termica = Number((1 + (X - 20) * 0.000012).toFixed(6))
  } else {
    newRow.Y_Dilatacao_Termica = ''
  }

  // Z: Densidade_Lab_20C
  if (prevRow && !hasVal(newRow.Z_Densidade_Lab_20C)) {
    newRow.Z_Densidade_Lab_20C = prevRow.Z_Densidade_Lab_20C
  }

  // AA: T_Observada_C = X
  newRow.AA_T_Observada_C = newRow.X_Temp_Fluido

  // AB: FCV Calculation
  let effectiveFCV = 1.0

  if (hasVal(newRow.AB_FCV_Manual)) {
    effectiveFCV = val(newRow.AB_FCV_Manual)
    newRow.AB_FCV = effectiveFCV
  } else if (
    hasVal(newRow.Z_Densidade_Lab_20C) &&
    hasVal(newRow.AA_T_Observada_C)
  ) {
    const densityObs = val(newRow.Z_Densidade_Lab_20C)
    const tempObs = val(newRow.AA_T_Observada_C)

    if (densityObs > 0) {
      try {
        const api11Result = calculateCrudeApi11To20({
          massaEspObs_gcc: densityObs,
          tempFluidoC: tempObs,
        })
        effectiveFCV = api11Result.fcv20
        newRow.AB_FCV = effectiveFCV
      } catch (error) {
        console.error('Error calculating FCV:', error)
        newRow.AB_FCV = 1.0
      }
    } else {
      newRow.AB_FCV = 1.0
    }
  } else {
    newRow.AB_FCV = 1.0 // Default
  }

  // AH: Referencia
  if (hasVal(newRow.Z_Densidade_Lab_20C) && effectiveFCV > 0) {
    const z = val(newRow.Z_Densidade_Lab_20C)
    const correctedDensity = z / effectiveFCV
    newRow.AH_Referencia = Number(correctedDensity.toFixed(6))
  } else {
    newRow.AH_Referencia = ''
  }

  // Q: Prod_Oleo_Corrigido_m3_d
  if (hasVal(newRow.P_Prod_Oleo_Sem_Correcao_m3_d)) {
    const P_val = val(newRow.P_Prod_Oleo_Sem_Correcao_m3_d)
    const Y_val = hasVal(newRow.Y_Dilatacao_Termica)
      ? val(newRow.Y_Dilatacao_Termica)
      : 1
    const AB_val = effectiveFCV
    const AC_val = hasVal(newRow.AC_Fator_Encolhimento_FE)
      ? val(newRow.AC_Fator_Encolhimento_FE)
      : 1

    newRow.Q_Prod_Oleo_Corrigido_m3_d = Number(
      (P_val * Y_val * AB_val * AC_val).toFixed(4),
    )
  } else {
    newRow.Q_Prod_Oleo_Corrigido_m3_d = ''
  }

  // R: Agua_Emulsao_m3_d = O - P
  if (
    hasVal(newRow.O_Prod_Emulsao_QEM_m3_d) &&
    hasVal(newRow.P_Prod_Oleo_Sem_Correcao_m3_d)
  ) {
    newRow.R_Agua_Emulsao_m3_d = Number(
      (O - val(newRow.P_Prod_Oleo_Sem_Correcao_m3_d)).toFixed(4),
    )
  } else {
    newRow.R_Agua_Emulsao_m3_d = ''
  }

  // S: Agua_Total_Produzida_m3_d = M + R
  if (
    hasVal(newRow.M_Prod_Agua_Livre_QWF_m3_d) &&
    hasVal(newRow.R_Agua_Emulsao_m3_d)
  ) {
    newRow.S_Agua_Total_Produzida_m3_d = Number(
      (M + val(newRow.R_Agua_Emulsao_m3_d)).toFixed(4),
    )
  } else {
    newRow.S_Agua_Total_Produzida_m3_d = ''
  }

  // T: BSW_Total_Calculado
  const S = val(newRow.S_Agua_Total_Produzida_m3_d)
  if (
    hasVal(newRow.S_Agua_Total_Produzida_m3_d) &&
    hasVal(newRow.L_Prod_Total_QT_m3_d) &&
    L !== 0
  ) {
    newRow.T_BSW_Total_Calculado = Number((S / L).toFixed(4))
  } else {
    newRow.T_BSW_Total_Calculado = ''
  }

  // AD: Vol_Bruto_Transf_Emulsao = K
  newRow.AD_Vol_Bruto_Transf_Emulsao = newRow.K_Transferencia_Emulsao

  // AE: Vol_Agua_Transf
  const AD = val(newRow.AD_Vol_Bruto_Transf_Emulsao)
  if (
    hasVal(newRow.AD_Vol_Bruto_Transf_Emulsao) &&
    hasVal(newRow.V_BSW_Emulsao_Perc)
  ) {
    newRow.AE_Vol_Agua_Transf = Number((AD * V).toFixed(4))
  } else {
    newRow.AE_Vol_Agua_Transf = ''
  }

  // AF: Vol_Oleo_Transf_Sem_Corr
  const AE = val(newRow.AE_Vol_Agua_Transf)
  if (
    hasVal(newRow.AD_Vol_Bruto_Transf_Emulsao) &&
    hasVal(newRow.AE_Vol_Agua_Transf)
  ) {
    newRow.AF_Vol_Oleo_Transf_Sem_Corr = Number((AD - AE).toFixed(4))
  } else {
    newRow.AF_Vol_Oleo_Transf_Sem_Corr = ''
  }

  // AG: Vol_Oleo_Transf_Com_Corr
  if (hasVal(newRow.AF_Vol_Oleo_Transf_Sem_Corr)) {
    const AF_val = val(newRow.AF_Vol_Oleo_Transf_Sem_Corr)
    const Y_val = hasVal(newRow.Y_Dilatacao_Termica)
      ? val(newRow.Y_Dilatacao_Termica)
      : 1
    const AB_val = effectiveFCV
    const AC_val = hasVal(newRow.AC_Fator_Encolhimento_FE)
      ? val(newRow.AC_Fator_Encolhimento_FE)
      : 1

    newRow.AG_Vol_Oleo_Transf_Com_Corr = Number(
      (AF_val * Y_val * AB_val * AC_val).toFixed(4),
    )
  } else {
    newRow.AG_Vol_Oleo_Transf_Com_Corr = ''
  }

  return newRow
}

export function lookupCalibrationValue(
  height: number,
  data: CalibrationRow[],
  field: 'volume_m3' | 'fcv',
): number {
  const defaultValue = field === 'fcv' ? 1.0 : 0
  if (!data || data.length === 0) return defaultValue

  const getVal = (row: CalibrationRow) => row[field] ?? defaultValue

  if (height <= data[0].altura_mm) return getVal(data[0])

  const lastIndex = data.length - 1
  if (height > data[lastIndex].altura_mm) {
    if (data.length >= 2) {
      const p2 = data[lastIndex]
      const p1 = data[lastIndex - 1]
      const heightDiff = p2.altura_mm - p1.altura_mm
      if (heightDiff !== 0) {
        const val2 = getVal(p2)
        const val1 = getVal(p1)
        const slope = (val2 - val1) / heightDiff
        const extrapolated = val2 + (height - p2.altura_mm) * slope
        return Number(extrapolated.toFixed(6))
      }
    }
    return getVal(data[lastIndex])
  }

  let low = 0
  let high = data.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const midVal = data[mid].altura_mm
    if (midVal === height) return getVal(data[mid])
    else if (midVal < height) low = mid + 1
    else high = mid - 1
  }

  const p1 = data[high]
  const p2 = data[low]
  if (!p1 || !p2) return defaultValue

  const heightDiff = p2.altura_mm - p1.altura_mm
  if (heightDiff === 0) return getVal(p1)

  const val1 = getVal(p1)
  const val2 = getVal(p2)
  const slope = (val2 - val1) / heightDiff
  const interpolated = val1 + (height - p1.altura_mm) * slope
  return Number(interpolated.toFixed(6))
}

export const calculateOperationData = (
  op: Partial<TankOperation>,
  calibrationData: CalibrationRow[],
): TankOperation => {
  const calculated = { ...op } as TankOperation

  // Calculate Volumes from Levels
  if (op.initialLevelMm !== undefined) {
    calculated.initialVolumeM3 = lookupCalibrationValue(
      op.initialLevelMm,
      calibrationData,
      'volume_m3',
    )
  }
  if (op.finalLevelMm !== undefined) {
    calculated.finalVolumeM3 = lookupCalibrationValue(
      op.finalLevelMm,
      calibrationData,
      'volume_m3',
    )
  }

  // Net Volume
  if (
    calculated.initialVolumeM3 !== undefined &&
    calculated.finalVolumeM3 !== undefined
  ) {
    if (
      calculated.type === 'production' ||
      calculated.type === 'stock_variation'
    ) {
      // For production/stock variation, use signed variation (Final - Initial)
      calculated.volumeM3 = Number(
        (calculated.finalVolumeM3 - calculated.initialVolumeM3).toFixed(4),
      )
    } else {
      // For drainage/transfer, use magnitude (Abs difference)
      calculated.volumeM3 = Number(
        Math.abs(calculated.finalVolumeM3 - calculated.initialVolumeM3).toFixed(
          4,
        ),
      )
    }
  }

  // Corrections
  if (op.type === 'transfer' && calculated.volumeM3) {
    // Specific logic for Transfer as per requirements
    // Use FCV and FE from inputs, calculate Y from Temp
    const fcv = op.fcv || 1.0
    const fe = op.fe || 1.0
    const bsw = (op.bswPercent || 0) / 100
    const temp = op.tempFluidC || op.tempAmbientC || 20

    // Y Factor (Thermal)
    // Updated formula for Carbon Steel: 1 + (Temp - 20) * 0.000012
    const yFactor = 1 + (temp - 20) * 0.000012

    // Gross = volumeM3 (Using Abs for Transfer)
    // Water Emulsion
    calculated.waterVolumeM3 = Number((calculated.volumeM3 * bsw).toFixed(4))

    // Oil Uncorrected
    const oilUncorrected = calculated.volumeM3 - calculated.waterVolumeM3

    // Oil Corrected = OilUncorrected * Y * FCV * FE
    calculated.oilVolumeM3 = Number(
      (oilUncorrected * yFactor * fcv * fe).toFixed(4),
    )

    // Store Oil Corrected in volumeCorrectedM3 (mapped to volume_corrected_m3 in DB)
    calculated.volumeCorrectedM3 = calculated.oilVolumeM3

    calculated.ctl = Number(yFactor.toFixed(6))
  } else if (
    (op.type === 'production' || op.type === 'stock_variation') &&
    calculated.volumeM3
  ) {
    // Existing Production/Stock Variation Logic
    const density = op.densityObservedGcm3
    const temp = op.tempFluidC ?? op.tempAmbientC

    if (density && temp) {
      try {
        const api11Result = calculateCrudeApi11To20({
          massaEspObs_gcc: density,
          tempFluidoC: temp,
        })
        calculated.ctl = api11Result.fcv20
      } catch (error) {
        console.error('Error calculating FCV in operation:', error)
        calculated.ctl = 1.0
      }
    } else {
      calculated.ctl = 1.0
    }

    calculated.volumeCorrectedM3 = Number(
      (calculated.volumeM3 * (calculated.ctl || 1.0)).toFixed(4),
    )

    const bsw = (op.bswPercent || 0) / 100
    calculated.waterVolumeM3 = Number(
      (calculated.volumeCorrectedM3 * bsw).toFixed(4),
    )
    calculated.oilVolumeM3 = Number(
      (calculated.volumeCorrectedM3 * (1 - bsw)).toFixed(4),
    )
  } else if (op.type === 'drainage' && calculated.volumeM3) {
    calculated.volumeCorrectedM3 = calculated.volumeM3
    calculated.waterVolumeM3 = calculated.volumeM3
    calculated.oilVolumeM3 = 0
  }

  return calculated
}

export const consolidateDailyOperations = (
  date: Date,
  operations: TankOperation[],
  prevRow?: ProductionRow,
): ProductionRow => {
  // Use Production Day window
  const { start, end } = getProductionDayWindow(date)

  // Filter operations for this day window
  const dailyOps = operations.filter((op) => {
    const opDate = parseISO(op.endTime)
    return isWithinInterval(opDate, { start, end })
  })

  // Use the new calculation helper
  const metrics = calculateDailyMetrics(dailyOps)

  // Construct Row
  const row: ProductionRow = {
    ...INITIAL_PRODUCTION_ROW,
    id: `consol-${date.getTime()}`,
    A_Data: start.toISOString(),
    D_Data_fim_periodo: end.toISOString(),

    // Set Aggregates
    J_Volume_Drenado_Agua_m3: metrics.drained,
    K_Transferencia_Emulsao: metrics.transferred,

    // Production Fields
    // L (Gross Prod) = wellProduction
    L_Prod_Total_QT_m3_d: metrics.wellProduction,
    S_Agua_Total_Produzida_m3_d: metrics.emulsionWaterVolume,
    Q_Prod_Oleo_Corrigido_m3_d: metrics.correctedOilVolume,
    P_Prod_Oleo_Sem_Correcao_m3_d: metrics.uncorrectedOilVolume,

    // Specifics
    Z_Densidade_Lab_20C: metrics.densityAt20cGcm3,
    AB_FCV: metrics.fcv,
    X_Temp_Fluido: metrics.fluidTempC,
    AA_T_Observada_C: metrics.fluidTempC,

    // BSW
    T_BSW_Total_Calculado: metrics.totalBswPercent / 100,
    U_BSW_Total_Perc: metrics.totalBswPercent,
    V_BSW_Emulsao_Perc: metrics.emulsionBswPercent,

    H_Volume_Corrigido_24h: metrics.wellProduction, // L = H
  }

  if (dailyOps.length > 0) {
    // Sort by time
    const sorted = [...dailyOps].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    row.B_Altura_Liq_Inicial_mm = first.initialLevelMm
    row.E_Altura_Liq_Final_mm = last.finalLevelMm
  } else if (prevRow) {
    // No ops, carry over
    row.B_Altura_Liq_Inicial_mm = prevRow.E_Altura_Liq_Final_mm
    row.E_Altura_Liq_Final_mm = prevRow.E_Altura_Liq_Final_mm
  }

  return row
}
