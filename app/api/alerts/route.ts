import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const alertDays = [30, 14, 7, 1]

    for (const days of alertDays) {
      const expiryDate = new Date(today)
      expiryDate.setDate(expiryDate.getDate() + days)
      const expiryDateStr = expiryDate.toISOString().split('T')[0]

      const { data: assets, error } = await supabase
        .from('assets')
        .select('*, clients(user_id, name)')
        .eq('expiration_date', expiryDateStr)

      if (error) throw error

      for (const asset of assets || []) {
        const { data: user } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', asset.clients.user_id)
          .single()

        if (user?.email) {
          await resend.emails.send({
            from: 'alerts@contractwatch.io',
            to: user.email,
            subject: `⏰ Renewal alert: ${asset.name} expires in ${days} days`,
            html: `<p>Your asset <strong>${asset.name}</strong> will expire in <strong>${days} days</strong> on ${expiryDate.toDateString()}.</p><p><a href="https://contractwatch.vercel.app/dashboard">View in ContractWatch</a></p>`
          })

          await supabase
            .from('alert_logs')
            .insert({ asset_id: asset.id, alert_date: today.toISOString() })
        }
      }
    }

    return Response.json({ success: true, message: 'Alerts processed' })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
