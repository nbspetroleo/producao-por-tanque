import { supabase } from '@/lib/supabase/client'
import { DbCalibrationData } from '@/lib/db-types'
import {
  ProductionRow,
  CalibrationRow,
  SealRow,
  BatchCalibrationOperations,
  ProductionChartItem,
} from '@/lib/types'
import { auditService } from './auditService'
import { startOfDay, endOfDay, format } from 'date-fns'

export const sheetService = {
  // Production Data
  async getProductionData(tankId: string): Promise<ProductionRow[]> {
    const { data, error } = await supabase
      .from('production_data')
      .select('raw_data')
      .eq('tank_id', tankId)
      .order('date', { ascending: true })

    if (error) throw error
    return data.map((d: any) => d.raw_data as ProductionRow)
  },

  async getProductionChartData(
    tankIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ProductionChartItem[]> {
    if (tankIds.length === 0) return []

    // Ensure we query with YYYY-MM-DD strings for report_date column
    const start = format(startDate, 'yyyy-MM-dd')
    const end = format(endDate, 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('daily_production_reports')
      .select(
        'tank_id, report_date, calculated_well_production_m3, drained_volume_m3, transferred_volume_m3, emulsion_water_volume_m3, uncorrected_oil_volume_m3, total_bsw_percent',
      )
      .in('tank_id', tankIds)
      .gte('report_date', start)
      .lte('report_date', end)
      .order('report_date', { ascending: true })

    if (error) throw error

    return data.map((d: any) => ({
      tank_id: d.tank_id,
      date: d.report_date,
      well_production: Number(d.calculated_well_production_m3 || 0),
      drained: Number(d.drained_volume_m3 || 0),
      transferred: Number(d.transferred_volume_m3 || 0),
      water_production: Number(d.emulsion_water_volume_m3 || 0),
      uncorrected_oil_production: Number(d.uncorrected_oil_volume_m3 || 0),
      total_bsw_percent: Number(d.total_bsw_percent || 0),
    }))
  },

  async saveProductionData(tankId: string, rows: ProductionRow[]) {
    const { error: deleteError } = await supabase
      .from('production_data')
      .delete()
      .eq('tank_id', tankId)

    if (deleteError) throw deleteError

    if (rows.length === 0) return

    const dbRows = rows.map((row) => ({
      tank_id: tankId,
      date: row.D_Data_fim_periodo || null,
      gross_production: parseFloat(String(row.L_Prod_Total_QT_m3_d)) || 0,
      total_water_production:
        parseFloat(String(row.S_Agua_Total_Produzida_m3_d)) || 0,
      uncorrected_oil_production:
        parseFloat(String(row.P_Prod_Oleo_Sem_Correcao_m3_d)) || 0,
      corrected_oil_production:
        parseFloat(String(row.Q_Prod_Oleo_Corrigido_m3_d)) || 0,
      raw_data: row,
    }))

    const { error } = await supabase.from('production_data').insert(dbRows)
    if (error) throw error
  },

  // Calibration Data
  async getCalibrationData(
    tankId: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: CalibrationRow[]; count: number }> {
    let query = supabase
      .from('calibration_data')
      .select('*', { count: 'exact' })
      .eq('tank_id', tankId)
      .order('height_mm', { ascending: true })

    if (page !== undefined && pageSize !== undefined) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    } else {
      query = query.limit(100000)
    }

    const { data, error, count } = await query

    if (error) throw error
    return {
      data: data.map((d: DbCalibrationData) => ({
        id: d.id,
        altura_mm: Number(d.height_mm),
        volume_m3: Number(d.volume_m3),
        fcv: d.fcv ? Number(d.fcv) : undefined,
      })),
      count: count || 0,
    }
  },

  async saveCalibrationData(
    tankId: string,
    rows: CalibrationRow[],
    reason?: string,
    userId?: string,
  ) {
    const dbRows = rows.map((row) => ({
      height_mm: row.altura_mm,
      volume_m3: row.volume_m3,
      fcv: row.fcv,
    }))

    const { error } = await supabase.rpc('import_calibration_data', {
      p_tank_id: tankId,
      p_data: dbRows as any,
    })

    if (error) throw error

    if (reason && userId) {
      await auditService.createLog({
        userId,
        entityType: 'calibration',
        entityId: tankId,
        operationType: 'update_calibration',
        reason,
      })
    }
  },

  async batchUpdateCalibration(
    tankId: string,
    operations: BatchCalibrationOperations,
    reason: string,
    userId: string,
  ) {
    if (operations.deletes.length > 0) {
      const { error } = await supabase
        .from('calibration_data')
        .delete()
        .in('id', operations.deletes)
      if (error) throw error
    }

    if (operations.updates.length > 0) {
      const updates = operations.updates.map((row) => ({
        id: row.id,
        tank_id: tankId,
        height_mm: row.altura_mm,
        volume_m3: row.volume_m3,
        fcv: row.fcv,
      }))
      const { error } = await supabase
        .from('calibration_data')
        .upsert(updates)
        .select()
      if (error) throw error
    }

    if (operations.inserts.length > 0) {
      const inserts = operations.inserts.map((row) => ({
        tank_id: tankId,
        height_mm: row.altura_mm,
        volume_m3: row.volume_m3,
        fcv: row.fcv,
      }))
      const { error } = await supabase.from('calibration_data').insert(inserts)
      if (error) throw error
    }

    const summary = `Batch Update: ${operations.inserts.length} inserted, ${operations.updates.length} updated, ${operations.deletes.length} deleted.`
    await auditService.createLog({
      userId,
      entityType: 'calibration',
      entityId: tankId,
      operationType: 'batch_update',
      newValue: summary,
      reason,
    })
  },

  async importCalibrationData(
    tankId: string,
    file: File,
    reason: string,
    userId: string,
  ): Promise<number> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tankId', tankId)

    const { data, error } = await supabase.functions.invoke(
      'import-calibration',
      {
        body: formData,
      },
    )

    if (error) {
      let errorMessage = 'Erro ao processar o arquivo.'

      if (error && typeof error === 'object' && 'context' in error) {
        // @ts-expect-error
        const context = error.context
        if (context && typeof context === 'object' && 'json' in context) {
          try {
            const body = await context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          } catch (e) {
            // ignore
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      if (data && data.error) {
        errorMessage = data.error
      }

      throw new Error(errorMessage)
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Erro desconhecido na importação.')
    }

    await auditService.createLog({
      userId,
      entityType: 'calibration',
      entityId: tankId,
      operationType: 'import_calibration',
      reason,
    })

    return data.count
  },

  async exportCalibrationData(tankId: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'export-calibration',
        {
          body: { tankId },
          responseType: 'blob',
        },
      )

      if (error) {
        console.error('Export Function Error:', error)
        throw new Error('Dados recebidos em formato inválido.')
      }

      if (!data) {
        throw new Error('Dados recebidos em formato inválido.')
      }

      if (!(data instanceof Blob)) {
        throw new Error('Dados recebidos em formato inválido.')
      }

      // Check Content-Type (robust validation as per user story)
      const type = data.type ? data.type.toLowerCase() : ''
      if (!type.includes('text/csv')) {
        console.error('Invalid content type received:', type)
        throw new Error('Dados recebidos em formato inválido.')
      }

      return data
    } catch (error: any) {
      console.error('Export exception in sheetService:', error)

      // Ensure the specific error message required by acceptance criteria is returned
      if (error.message === 'Dados recebidos em formato inválido.') {
        throw error
      }

      // Handle the specific technical error mentioned in requirements to ensure it doesn't leak
      if (
        error.message &&
        (error.message.includes('Cannot read properties of undefined') ||
          error.message.includes("reading 'includes'") ||
          error.message.includes('undefined'))
      ) {
        throw new Error('Dados recebidos em formato inválido.')
      }

      // Default fallback for any export error to match requirement
      throw new Error('Dados recebidos em formato inválido.')
    }
  },

  async deleteCalibrationData(tankId: string, reason: string, userId: string) {
    const { error } = await supabase
      .from('calibration_data')
      .delete()
      .eq('tank_id', tankId)

    if (error) throw error

    await auditService.createLog({
      userId,
      entityType: 'calibration_table',
      entityId: tankId,
      operationType: 'delete',
      reason,
    })
  },

  // Seal Data
  async getSealData(tankId: string): Promise<SealRow[]> {
    const { data, error } = await supabase
      .from('seal_data')
      .select('raw_data')
      .eq('tank_id', tankId)
      .order('date', { ascending: true })

    if (error) throw error
    return data.map((d: any) => d.raw_data as SealRow)
  },

  async saveSealData(tankId: string, rows: SealRow[]) {
    const { error: deleteError } = await supabase
      .from('seal_data')
      .delete()
      .eq('tank_id', tankId)

    if (deleteError) throw deleteError

    if (rows.length === 0) return

    const dbRows = rows.map((row) => ({
      tank_id: tankId,
      date: row.data || null,
      raw_data: row,
    }))

    const { error } = await supabase.from('seal_data').insert(dbRows)
    if (error) throw error
  },
}
