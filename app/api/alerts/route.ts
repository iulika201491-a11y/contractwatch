import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendKey = process.env.RESEND_API_KEY

    if (!supabaseUrl || !supabaseServiceKey || !resendKey) {
      return Response.json({ error: 'Missing environment variables' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resend = new Resend(resendKey)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDateStr = today.toISOString().split('T')[0]

    console.log('Looking for assets expiring on:', expiryDateStr)

    const { data: assets, error } = await supabase
      .from('assets')
      .select('*, clients(user_id, name)')
      .eq('expiration_date', expiryDateStr)

    console.log('Assets found:', assets)
    console.log('Query error:', error)

    if (error) throw error

    for (const asset of assets || []) {
      console.log('Processing asset:', asset.name)

      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', asset.clients.user_id)
        .single()

      console.log('User found:', user)

      if (user?.email) {
        console.log('Sending email to:', user.email)

        const emailResult = await resend.emails.send({
         from: 'onboarding@resend.dev',

          to: user.email,
          subject: `⏰ Renewal alert: ${asset.name} expires today`,
          html: `<p>Your asset <strong>${asset.name}</strong> expires TODAY.</p><p><a href="https://contractwatch.vercel.app/dashboard">View in ContractWatch</a></p>`
        })

        console.log('Email result:', emailResult)

        if (emailResult.error) {
          console.error('Email send error:', emailResult.error)
        }
      }
    }

    return Response.json({ success: true, message: 'Alerts processed' })
  } catch (error) {
    console.error('Fatal error:', error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
