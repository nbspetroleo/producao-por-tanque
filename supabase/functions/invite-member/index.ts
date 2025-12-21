import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Init Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 2. Parse Body
    const { projectId, email } = await req.json()
    if (!projectId || !email) throw new Error('Missing projectId or email')

    // 3. Verify Permission (Check if requester is owner)
    const {
      data: { user: requester },
    } = await supabaseClient.auth.getUser()
    if (!requester) throw new Error('Unauthorized')

    const { data: membership, error: membershipError } = await supabaseClient
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', requester.id)
      .single()

    if (membershipError || membership?.role !== 'owner') {
      throw new Error('Unauthorized: You must be an owner to invite members.')
    }

    // Get Project Name
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    // 4. Find User ID by Email
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (listError) throw listError

    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    )

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found with this email.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 5. Insert Member
    const { data: newMember, error: insertError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role: 'viewer',
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('User is already a member of this project.')
      }
      throw insertError
    }

    // 6. Send Invitation Email
    const subject = `Convite para o projeto: ${project?.name}`
    const htmlContent = `
      <p>Olá,</p>
      <p>Você foi convidado por <strong>${requester.email}</strong> para colaborar no projeto <strong>${project?.name}</strong>.</p>
      <p>Você pode acessar o projeto clicando no link abaixo:</p>
      <p><a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app')}/project/${projectId}/dashboard">Acessar Projeto</a></p>
    `

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'RTM NBS <noreply@resend.dev>',
          to: [email],
          subject: subject,
          html: htmlContent,
        }),
      })
    } else {
      console.log('Sending Invite Email (Mock):', subject)
    }

    // 7. Return success
    return new Response(JSON.stringify({ success: true, member: newMember }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
