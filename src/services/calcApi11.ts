import { supabase } from "@/lib/supabase/client"

export interface CalcApi11Input {
  tempFluidoC: number
  massaEspObs_gcc: number
}

export async function calcApi11(input: CalcApi11Input) {
  const { data, error } = await supabase.functions.invoke("calc-api11", {
    body: input,
  })

  if (error) {
    console.error("Erro na Edge Function:", error)
    throw new Error("Erro ao calcular FCV (Edge Function)")
  }

  return data
}
