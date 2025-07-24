"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { showToast } from "@/components/toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate form inputs
      if (!form.email || !form.password) {
        throw new Error("All fields are required");
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        throw authError;
      }

      showToast("success", "Login successful!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/icons/signuplogo.png"
          alt="Onvitec Logo"
          width={150}
          height={50}
          className="mx-auto"
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[464px] bg-white rounded-lg shadow-sm p-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome Back!
        </h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Please log in to your account to continue.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              onChange={handleChange}
              value={form.email}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <a
                href="/forgot-password"
                className="text-xs text-red-500 hover:underline"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                onChange={handleChange}
                value={form.password}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-start">{error}</p>}

          <Button
            type="submit"
            className="w-full mt-6 bg-[#2E3545] hover:bg-[#2E3545]/90 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{" "}
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