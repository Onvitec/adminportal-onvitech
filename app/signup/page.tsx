"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { showToast } from "@/components/toast";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { firstName, lastName, email, password } = form;

      if (!firstName || !lastName || !email || !password) {
        throw new Error("All fields are required");
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("User creation failed");

      // Insert user into your own DB
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        role: "Admin",
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error("Failed to create user profile");
      }

      showToast("success", "Signup successful! Please log in.");
      window.location.href = "/login";
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      showToast("error", err.message || "Failed to create account");
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
      <form
        onSubmit={handleSignup}
        className="w-full max-w-[464px] bg-white rounded-lg shadow-sm p-8 flex flex-col"
      >
        <h1 className="text-2xl font-semibold text-center mb-2">Sign Up</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Please create an account to continue.
        </p>

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
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                onChange={handleChange}
                value={form.password}
                required
                minLength={6}
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

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            type="submit"
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
      </form>

      <div className="mt-8 text-sm text-gray-500">
        Copyright © 2025 Onvitec. All Rights Reserved
      </div>
    </div>
  );
}
