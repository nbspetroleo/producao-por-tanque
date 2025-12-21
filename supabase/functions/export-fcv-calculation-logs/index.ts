import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { startDate, endDate, format = 'csv' } = await req.json()

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data, error } = await supabaseClient
      .from('fcv_calculation_logs')
      .select('*')
      .gte('calculated_at', startDate)
      .lte('calculated_at', endDate)
      .order('calculated_at', { ascending: false })

    if (error) throw error

    if (format === 'json') {
      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="fcv_logs.json"`,
        },
        status: 200,
      })
    }

    // CSV Format
    const headers = [
      'id',
      'user_id',
      'calculated_at',
      'fluid_temp_c',
      'observed_density_gcm3',
      'density_at_20c_gcm3',
      'fcv',
      'reference_base',
      'pressure_kpag',
      'applied_norm',
      'algorithm_version',
    ]

    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header]
        if (val === null || val === undefined) return ''
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`
        return String(val)
      })
      csvRows.push(values.join(','))
    }

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fcv_logs.csv"`,
      },
      status: 200,
    })
  } catch (error) {
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
