import { describe, it, expect } from "vitest";
import { calculateCrudeApi11To20 } from "../../src/engine";

describe("Engine contract", () => {
  it("calculateCrudeApi11To20 deve retornar o contrato mínimo", () => {
    const result = calculateCrudeApi11To20({
      tempFluidoC: 42,
      massaEspObs_gcc: 0.92,
    });

    // campos obrigatórios
    expect(result).toHaveProperty("density20_gcc");
    expect(result).toHaveProperty("fcv20");
    expect(result).toHaveProperty("rho60_kgm3");
    expect(result).toHaveProperty("ctl_60_to_20");
    expect(result).toHaveProperty("alpha60");

    // tipos
    expect(typeof result.density20_gcc).toBe("number");
    expect(typeof result.fcv20).toBe("number");
  });
});
