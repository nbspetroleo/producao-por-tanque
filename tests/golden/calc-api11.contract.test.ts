import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { config as loadDotenv } from 'dotenv'
import { calculateCrudeApi11To20 } from '../../src/engine/api11_1_crude'

// carrega variáveis de teste
loadDotenv({ path: '.env.test.local' })

describe('calc-api11 contract (edge vs local)', () => {
  it('deve retornar o mesmo resultado (dentro de tolerância)', async () => {
    const url = process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

    expect(url).toBeTruthy()
    expect(anonKey).toBeTruthy()

    const supabase = createClient(url!, anonKey!)

    const input = { tempFluidoC: 42, massaEspObs_gcc: 0.92 }

    // cálculo local
    const local = calculateCrudeApi11To20(input)

    // chamada autenticada (anon key)
    const { data, error } = await supabase.functions.invoke('calc-api11', {
      body: input,
    })

    expect(error).toBeNull()
    expect(data?.ok).toBe(true)

    const edge = data!.result

    expect(edge.fcv20).toBeCloseTo(local.fcv20, 8)
    expect(edge.density20_gcc).toBeCloseTo(local.density20_gcc, 8)
    expect(edge.rho60_kgm3).toBeCloseTo(local.rho60_kgm3, 6)
    expect(edge.alpha60).toBeCloseTo(local.alpha60, 10)
  })
})
