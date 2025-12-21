import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create Supabase Client with Service Role Key (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 2. Get Request Data
    const { email, role } = await req.json()

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 3. Create User in Auth
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm so they can just reset password/login
        password: 'tempPassword123!', // They should reset this. Ideally send invite.
      })

    if (createError) throw createError

    // 4. Send Invite Email (Trigger password reset flow)
    await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    // 5. Insert/Update Profile with Role
    // The trigger might have inserted 'operator', so we upsert.
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userData.user.id,
        role: role,
        updated_at: new Date().toISOString(),
      })

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({
        user: userData.user,
        message: 'User created and invited',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
