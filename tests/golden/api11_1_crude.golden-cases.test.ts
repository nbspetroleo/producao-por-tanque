import { describe, it, expect } from 'vitest'
import cases from './data/api11_1_crude_cases.json'
import {
  calculateCrudeApi11To20,
  ALGORITHM_VERSION,
} from '../../src/lib/api11_1_crude'


type Case = {
  id: string
  tempFluidoC: number
  massaEspObs_gcc: number
}

describe('API 11.1 Crude – golden cases', () => {
  it('deve produzir resultados determinísticos e válidos para todos os casos', () => {
    for (const c of cases as Case[]) {
      const res = calculateCrudeApi11To20({
        tempFluidoC: c.tempFluidoC,
        massaEspObs_gcc: c.massaEspObs_gcc,
      })

      // versão do algoritmo
      expect(ALGORITHM_VERSION).toBe('api11_1_crude_v1.0.0')

      // sanidade básica
      expect(res.fcv20).toBeGreaterThan(0.9)
      expect(res.fcv20).toBeLessThan(1.1)

      expect(res.density20_gcc).toBeGreaterThan(0.85)
      expect(res.density20_gcc).toBeLessThan(1.05)

      expect(res.rho60_kgm3).toBeGreaterThan(850)
      expect(res.rho60_kgm3).toBeLessThan(1050)

      expect(res.alpha60).toBeGreaterThan(0)
      expect(res.alpha60).toBeLessThan(0.001)

      // determinismo (mesma entrada → mesma saída)
      const res2 = calculateCrudeApi11To20({
        tempFluidoC: c.tempFluidoC,
        massaEspObs_gcc: c.massaEspObs_gcc,
      })

      expect(res2).toEqual(res)
    }
  })
})
