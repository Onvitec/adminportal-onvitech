'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { showToast } from '@/components/toast'
import { supabase } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      showToast('error', 'Please enter your email')
      return
    }

    setLoading(true)

    try {
      // Generate a password reset token
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      // Generate a password reset link
      const resetLink = `${window.location.origin}/reset-password`

      // Send email using EmailJS
      const emailResult = await sendPasswordResetEmail(email, resetLink)
      
      if (emailResult.error) {
        throw new Error(emailResult.error)
      }

      setEmailSent(true)
      showToast('success', 'Password reset link sent to your email! (Expires in 24 hours)')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8">
        <Image
          src="/icons/signuplogo.png"
          alt="Onvitec Logo"
          width={150}
          height={50}
          className="mx-auto"
        />
      </div>
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-center mb-2">Forgot Password</h1>
        
        {emailSent ? (
          <>
            <p className="text-sm text-gray-600 text-center mb-6">
              We've sent a password reset link to your email. Please check your inbox.
            </p>
            <div className="text-center">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 text-center mb-6">
              Enter your email to receive a password reset link
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}