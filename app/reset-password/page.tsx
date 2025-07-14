'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { showToast } from '@/components/toast'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [tokenChecked, setTokenChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setValidToken(!!session)
      } catch (error) {
        setValidToken(false)
      } finally {
        setTokenChecked(true)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      showToast('error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      showToast('error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error
      
      showToast('success', 'Password updated successfully!')
      router.push('/login')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="mb-8 flex justify-center">
          <Image
            src="/icons/signuplogo.png"
            alt="Onvitec Logo"
            width={150}
            height={50}
            priority
          />
        </div>
        
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-center mb-2">Verifying Link</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Please wait while we verify your password reset link...
          </p>
        </div>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="mb-8 flex justify-center">
          <Image
            src="/icons/signuplogo.png"
            alt="Onvitec Logo"
            width={150}
            height={50}
            priority
          />
        </div>
        
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-center mb-2">Invalid Link</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline text-center block">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 flex justify-center">
        <Image
          src="/icons/signuplogo.png"
          alt="Onvitec Logo"
          width={150}
          height={50}
          priority
        />
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-center mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}