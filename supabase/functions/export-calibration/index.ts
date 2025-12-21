import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tankId } = await req.json()

    if (!tankId) {
      // Return 200 so client can read the JSON error body
      return new Response(JSON.stringify({ error: 'tankId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data, error } = await supabaseClient
      .from('calibration_data')
      .select('height_mm, volume_m3, fcv')
      .eq('tank_id', tankId)
      .order('height_mm', { ascending: true })

    if (error) throw error

    // Generate CSV
    const headers = ['height_mm', 'volume_m3', 'fcv']
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header]
        // Escape quotes if necessary
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`
        }
        return val === null || val === undefined ? '' : String(val)
      })
      csvRows.push(values.join(','))
    }

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="calibration_data_${tankId}.csv"`,
      },
      status: 200,
    })
  } catch (error) {
    // Return 200 so client can read the JSON error body
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
