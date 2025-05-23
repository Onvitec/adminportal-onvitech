'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    setError('');

    // 1. Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 2. Add user to custom table
    if (authData.user) {
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: form.email,
        username: form.username
      });

      if (dbError) {
        setError('Failed to create user profile');
        return;
      }
    }

    // 3. Redirect to login page after successful signup
    window.location.href = '/login';
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

      {/* Signup Card */}
      <div className="w-full max-w-[464px] h-[480px] bg-white rounded-lg shadow-sm p-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-center mb-2">Sign Up</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Please create an account to continue.
        </p>

        {/* Form */}
        <div className="space-y-6 flex-grow">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              onChange={handleChange}
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button 
            onClick={handleSignup}
            className="w-full mt-4 bg-[#2E3545]"
          >
            Sign Up
          </Button>
        </div>

        <div className="mt-2 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-[#000000] hover:underline">
            Log in
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