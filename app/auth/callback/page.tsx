'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      // Get the session after clicking magic link
      const { data } = await supabase.auth.getSession()
      
      if (data.session) {
        // Create profile if it doesn't exist
        await supabase.from('profiles').upsert({
          id: data.session.user.id,
          email: data.session.user.email,
        })
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        router.push('/auth')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging you in...</p>
    </div>
  )
}
