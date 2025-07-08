"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { showToast } from "@/components/toast";

export default function SignupPage() {
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    setError("");
    setLoading(true);

    try {
      // Validate form inputs
      if (!form.email || !form.password || !form.firstName || !form.lastName) {
        throw new Error("All fields are required");
      }

      // Check if email already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from("users")
        .select("email")
        .eq("email", form.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("User creation failed");

      // Insert into custom users table with Admin role by default
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        role: "Admin", 
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("Database error:", dbError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error("Failed to create user profile");
      }

      showToast("success", "Signup successful! Please log in.");
      window.location.href = "/login";
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      showToast("error", err.message || "Failed to create account");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
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

      {/* Signup Card */}
      <div className="w-full max-w-[464px] bg-white rounded-lg shadow-sm p-8 flex flex-col">
        <h1 className="text-2xl font-semibold text-center mb-2">Sign Up</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Please create an account to continue.
        </p>

        {/* Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                onChange={handleChange}
                value={form.firstName}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                onChange={handleChange}
                value={form.lastName}
                required
              />
            </div>
          </div>

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              onChange={handleChange}
              value={form.password}
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            onClick={handleSignup}
            className="w-full mt-4 bg-[#2E3545] hover:bg-[#3A4255]"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#2E3545] font-medium hover:underline"
          >
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