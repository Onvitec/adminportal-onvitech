'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setError('');
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    // Redirect to dashboard after successful login
    window.location.href="/"
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* Logo */}
      <div className="mb-8">
        <Image 
          src="/icons/signuplogo.png" // Replace with your logo path
          alt="Onvitec Logo"
          width={150}
          height={50}
          className="mx-auto"
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[464px] bg-white rounded-lg shadow-sm p-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-center mb-2">Welcome Back!</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Please log in to your account to continue.
        </p>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <a href="/forgot-password" className="text-xs text-red-500 hover:underline">
                Forgot Password?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button 
            onClick={handleLogin}
            className="w-full mt-6 bg-[#2E3545]"
          >
            Sign In
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <a href="/signup" className="text-[#000000] hover:underline">
            Sign up
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-8 text-sm text-gray-500">
        Copyright © 2025 Onvitec. All Rights Reserved
      </div>
    </div>
  );
}