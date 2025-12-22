import { describe, it, expect } from "vitest";
import { ALGORITHM_VERSION, calculateCrudeApi11To20 } from "../../src/lib/api11_1_crude";

describe("API 11.1 Crude – golden", () => {
  it("versão do algoritmo (só muda quando você decidir)", () => {
    expect(ALGORITHM_VERSION).toBe("api11_1_crude_v1.0.0");
  });

  it("golden #1: 0.920 g/cc @ 42°C", () => {
    const input = { tempFluidoC: 42, massaEspObs_gcc: 0.92 };
    const result = calculateCrudeApi11To20(input);

    expect(result).toEqual({
      density20_gcc: 0.934516,
      fcv20: 0.984467,
      rho60_kgm3: 937.433172,
      ctl_60_to_20: 1.003122,
      alpha60: 0.0003881,
    });
  });

  it("golden #2: 0.970 g/cc @ 42°C", () => {
    const input = { tempFluidoC: 42, massaEspObs_gcc: 0.97 };
    const result = calculateCrudeApi11To20(input);

    expect(result).toEqual({
      density20_gcc: 0.983784,
      fcv20: 0.985989,
      rho60_kgm3: 986.555036,
      ctl_60_to_20: 1.002817,
      alpha60: 0.0003505,
    });
  });
});
