import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from clear-project-data!')

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    // Get the user from the JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { projectId } = await req.json()
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'ProjectId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use Service Role client for database operations to bypass RLS limitations during bulk delete if needed,
    // but primarily to ensure we can perform the checks and deletes reliably.
    // We validated the user above. Now check ownership.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify Project Ownership
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (project.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to access this project' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Get all Tank IDs for this project
    const { data: tanks, error: tanksError } = await supabaseAdmin
      .from('tanks')
      .select('id')
      .eq('project_id', projectId)

    if (tanksError) {
      throw new Error('Failed to retrieve tanks: ' + tanksError.message)
    }

    const tankIds = tanks.map((t: any) => t.id)

    if (tankIds.length > 0) {
      // 1. Delete Tank Operations (References Reports, so delete first if FK exists, but reports ref operations? No, usually Ops ref Reports or independent.
      // In this schema: tank_operations has daily_report_id FK to daily_production_reports.
      // So MUST delete tank_operations FIRST.
      const { error: opsError } = await supabaseAdmin
        .from('tank_operations')
        .delete()
        .in('tank_id', tankIds)

      if (opsError) {
        throw new Error('Failed to delete operations: ' + opsError.message)
      }

      // 2. Delete Daily Production Reports
      const { error: reportsError } = await supabaseAdmin
        .from('daily_production_reports')
        .delete()
        .in('tank_id', tankIds)

      if (reportsError) {
        throw new Error('Failed to delete reports: ' + reportsError.message)
      }

      // 3. Delete Production Data (The spreadhseet rows)
      const { error: prodDataError } = await supabaseAdmin
        .from('production_data')
        .delete()
        .in('tank_id', tankIds)

      if (prodDataError) {
        throw new Error(
          'Failed to delete production data: ' + prodDataError.message,
        )
      }

      // 4. Delete Seal Data (Optional but cleaner)
      const { error: sealDataError } = await supabaseAdmin
        .from('seal_data')
        .delete()
        .in('tank_id', tankIds)

      if (sealDataError) {
        throw new Error('Failed to delete seal data: ' + sealDataError.message)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project data cleared successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
