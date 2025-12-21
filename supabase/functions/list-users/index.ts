import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. List Auth Users
    const {
      data: { users },
      error: authError,
    } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    // 2. List Profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')

    if (profilesError) throw profilesError

    // 3. Merge Data
    const result = users.map((user) => {
      const profile = profiles.find((p) => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        role: profile?.role || 'operator', // Default if missing
        createdAt: profile?.created_at || user.created_at,
        updatedAt: profile?.updated_at || user.updated_at,
      }
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
