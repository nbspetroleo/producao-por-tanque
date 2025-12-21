import { supabase } from '@/lib/supabase/client'
import { ALGORITHM_VERSION } from '@/lib/api11_1_crude'

export interface FcvLogInput {
  fluidTempC: number
  observedDensityGcm3: number
  densityAt20cGcm3: number
  fcv: number
  userId: string
}

export const fcvLogService = {
  async logCalculation(input: FcvLogInput): Promise<void> {
    try {
      const { error } = await supabase.from('fcv_calculation_logs').insert({
        user_id: input.userId,
        fluid_temp_c: input.fluidTempC,
        observed_density_gcm3: input.observedDensityGcm3,
        density_at_20c_gcm3: input.densityAt20cGcm3,
        fcv: input.fcv,
        algorithm_version: ALGORITHM_VERSION,
        // Default values for other columns will be set by DB
      })

      if (error) {
        console.error('Failed to log FCV calculation:', error)
      }
    } catch (error) {
      console.error('Exception logging FCV calculation:', error)
    }
  },

  async exportLogs(
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json',
  ): Promise<Blob> {
    const { data, error } = await supabase.functions.invoke(
      'export-fcv-calculation-logs',
      {
        body: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format,
        },
        responseType: 'blob',
      },
    )

    if (error) {
      let errorMessage = 'Erro ao exportar logs.'
      if (
        error instanceof Error &&
        (error.message.includes('Cannot read properties of undefined') ||
          error.message.includes('undefined'))
      ) {
        errorMessage = 'Dados recebidos em formato inválido.'
      } else {
        errorMessage = error.message || errorMessage
      }
      throw new Error(errorMessage)
    }

    if (!data || !(data instanceof Blob)) {
      throw new Error('Dados recebidos em formato inválido.')
    }

    return data
  },
}
