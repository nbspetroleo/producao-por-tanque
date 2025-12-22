import { describe, it, expect } from "vitest";
import * as api11 from "../../src/lib/api11_1_crude";

/**
 * Smoke test:
 * - NÃO testa o cálculo
 * - Apenas garante que o módulo existe
 * - Serve para validar o pipeline de testes
 */
describe("API 11.1 Crude – smoke test", () => {
  it("deve exportar funções ou constantes", () => {
    expect(Object.keys(api11).length).toBeGreaterThan(0);
  });
});
