/// <reference types="https://deno.land/x/supabase_functions@1.0.0/mod.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  ALGORITHM_VERSION,
  calculateCrudeApi11To20,
} from "../../../src/engine/api11_1_crude.ts";

type Body = {
  tempFluidoC: number;
  massaEspObs_gcc: number;
};

// CORS
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

serve(async (req) => {
  try {
    // Preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // 🔐 Auth obrigatória
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    if (req.method !== "POST") {
      return json({ ok: false, error: "Use POST" }, 405);
    }

    const body = (await req.json()) as Partial<Body>;

    if (
      typeof body.tempFluidoC !== "number" ||
      typeof body.massaEspObs_gcc !== "number"
    ) {
      return json(
        { ok: false, error: "Envie { tempFluidoC, massaEspObs_gcc }" },
        400,
      );
    }

    const result = calculateCrudeApi11To20({
      tempFluidoC: body.tempFluidoC,
      massaEspObs_gcc: body.massaEspObs_gcc,
    });

    return json({
      ok: true,
      algorithmVersion: ALGORITHM_VERSION,
      result,
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
