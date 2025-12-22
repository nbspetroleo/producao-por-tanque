import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function TestCalcApi11Button() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function run() {
    setLoading(true);
    setOut(null);

    const { data, error } = await supabase.functions.invoke("calc-api11", {
      body: { tempFluidoC: 42, massaEspObs_gcc: 0.92 },
    });

    setOut({ data, error });
    console.log("invoke calc-api11 =>", { data, error });

    setLoading(false);
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
      <button onClick={run} disabled={loading} style={{ padding: "8px 12px" }}>
        {loading ? "Testando..." : "Testar Edge Function calc-api11"}
      </button>

      {out && (
        <pre style={{ marginTop: 12, fontSize: 12, overflow: "auto", maxHeight: 220 }}>
          {JSON.stringify(out, null, 2)}
        </pre>
      )}
    </div>
  );
}
