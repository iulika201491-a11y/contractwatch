'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus(`Error: ${error.message}`)
          return
        }

        if (session) {
          setStatus('Session found! Redirecting...')
          localStorage.setItem('contractwatch-auth', JSON.stringify(session))
          setTimeout(() => router.push('/dashboard'), 1000)
        } else {
          setStatus('No session found. Redirecting to login...')
          setTimeout(() => router.push('/auth'), 2000)
        }
      } catch (error) {
        setStatus(`Error: ${String(error)}`)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600 mb-4">{status}</p>
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    </div>
  )
}
