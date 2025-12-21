import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, type, data } = await req.json()

    if (!projectId || !type) {
      throw new Error('Missing projectId or type')
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Fetch Project Details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Project not found')
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Fetch Project Members with their Preferences
    const { data: members, error: membersError } = await supabaseAdmin
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)

    if (membersError) throw membersError

    // 3. Fetch User Profiles and Filter by Preference
    const userIds = members.map((m: any) => m.user_id)
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email_notification_preferences')
      .in('id', userIds)

    if (profilesError) throw profilesError

    // 4. Get Emails for these users
    // Using listUsers is necessary as user_profiles doesn't have emails usually,
    // unless we sync them. Assuming standard Auth usage.
    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

    const recipients = profiles
      .filter((p: any) => {
        const prefs = p.email_notification_preferences
        return prefs && prefs.project_updates === true
      })
      .map((p: any) => users.find((u) => u.id === p.id)?.email)
      .filter((email): email is string => !!email)

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Construct Email Content
    let subject = `Atualização no projeto: ${project.name}`
    let htmlContent = `<p>Olá,</p><p>Houve uma nova atualização no projeto <strong>${project.name}</strong>.</p>`

    if (type === 'operation') {
      subject = `Nova Operação - ${project.name}`
      htmlContent += `<p>Uma nova operação de <strong>${data.type}</strong> foi registrada.</p>`
      if (data.comments) htmlContent += `<p>Comentários: ${data.comments}</p>`
    } else if (type === 'report') {
      subject = `Relatório Atualizado - ${project.name}`
      htmlContent += `<p>Um relatório de produção para a data <strong>${data.reportDate}</strong> foi ${data.status === 'closed' ? 'fechado' : 'atualizado'}.</p>`
    } else if (type === 'alert') {
      subject = `ALERTA - ${project.name}`
      htmlContent += `<p>Alertas foram gerados:</p><ul>`
      if (Array.isArray(data)) {
        data.forEach((alert: any) => {
          htmlContent += `<li>${alert.message}</li>`
        })
      } else {
        htmlContent += `<li>${data.message}</li>`
      }
      htmlContent += `</ul>`
    }

    htmlContent += `<p><a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app')}/project/${projectId}/dashboard">Acesse o projeto aqui</a></p>`

    // 6. Send Email
    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'RTM NBS <noreply@resend.dev>', // Should be configured domain
          to: recipients,
          subject: subject,
          html: htmlContent,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        console.error('Resend API Error:', errData)
      } else {
        console.log(`Email sent to ${recipients.length} recipients`)
      }
    } else {
      console.log('RESEND_API_KEY not set. Mocking email send.')
      console.log('Recipients:', recipients)
      console.log('Subject:', subject)
      console.log('Body:', htmlContent)
    }

    return new Response(
      JSON.stringify({ success: true, count: recipients.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
