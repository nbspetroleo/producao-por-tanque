import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from import-calibration!')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body (FormData)
    const formData = await req.formData()
    const file = formData.get('file')
    const tankId = formData.get('tankId')

    if (!file || !tankId) {
      return new Response(
        JSON.stringify({ error: 'File and tankId are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Invalid file' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Parse Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

    if (!jsonData || jsonData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No data found in excel file' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Map Data
    const rows = jsonData.map((row) => {
      // Helper to check multiple variations of headers
      const getVal = (keys: string[]) => {
        for (const key of keys) {
          if (row[key] !== undefined) return row[key]
          // Also check lowercase
          const lowerKey = Object.keys(row).find(
            (k) => k.toLowerCase() === key.toLowerCase(),
          )
          if (lowerKey && row[lowerKey] !== undefined) return row[lowerKey]
        }
        return undefined
      }

      const height = getVal(['Altura', 'Altura (mm)', 'Height', 'Nível'])
      const volume = getVal(['Volume', 'Volume (m3)', 'Vol'])
      const fcv = getVal(['FCV', 'Fator', 'Fator de Correção'])

      if (height === undefined || volume === undefined) {
        return null // Skip invalid rows
      }

      return {
        height_mm: parseFloat(String(height)),
        volume_m3: parseFloat(String(volume)),
        fcv: fcv !== undefined ? parseFloat(String(fcv)) : 1.0,
      }
    })

    const validRows = rows.filter(
      (r) =>
        r !== null &&
        !isNaN(r.height_mm) &&
        !isNaN(r.volume_m3) &&
        !isNaN(r.fcv),
    )

    if (validRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid rows found in excel file' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Init Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Use RPC to bulk insert (delete + insert)
    const { error } = await supabaseClient.rpc('import_calibration_data', {
      p_tank_id: tankId,
      p_data: validRows,
    })

    if (error) {
      console.error('Supabase RPC error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, count: validRows.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Import Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
