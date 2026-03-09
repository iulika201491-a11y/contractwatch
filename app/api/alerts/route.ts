import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const today = new Date()
    
    // Check for assets expiring in 30, 14, 7, or 1 day
    const alertWindows = [
      { days: 30, type: '30days' },
      { days: 14, type: '14days' },
      { days: 7, type: '7days' },
      { days: 1, type: '1day' },
    ]

    for (const window of alertWindows) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + window.days)
      const targetDateStr = targetDate.toISOString().split('T')[0]

      // Get assets expiring on this date
      const { data: assets } = await supabase
        .from('assets')
        .select('id, name, expiration_date, client_id')
        .eq('expiration_date', targetDateStr)

      if (assets && assets.length > 0) {
        for (const asset of assets) {
          // Check if we already sent this alert
          const { data: existing } = await supabase
            .from('alert_logs')
            .select('id')
            .eq('asset_id', asset.id)
            .eq('alert_type', window.type)
            .limit(1)

          if (!existing || existing.length === 0) {
            // Get client info
            const { data: client } = await supabase
              .from('clients')
              .select('id, user_id, name')
              .eq('id', asset.client_id)
              .single()

            if (client) {
              // Get user email
              const { data: user } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', client.user_id)
                .single()

              if (user && user.email) {
                // Send email
                await resend.emails.send({
                  from: 'alerts@contractwatch.io',
                  to: user.email,
                  subject: `⏰ Renewal alert: ${asset.name} expires in ${window.days} days`,
                  html: `
                    <h2>Renewal Reminder</h2>
                    <p><strong>${asset.name}</strong> for <strong>${client.name}</strong> expires in <strong>${window.days} days</strong>.</p>
                    <p>Expiration date: <strong>${new Date(asset.expiration_date).toLocaleDateString()}</strong></p>
                    <p><a href="https://contractwatch-iulika201491-a11y.vercel.app/dashboard">View in dashboard</a></p>
                  `,
                })

                // Log the alert
                await supabase.from('alert_logs').insert({
                  asset_id: asset.id,
                  alert_type: window.type,
                })

                console.log(`Alert sent for ${asset.name}`)
              }
            }
          }
        }
      }
    }

    return Response.json({ success: true, message: 'Alerts processed' })
  } catch (error) {
    console.error('Alert error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
