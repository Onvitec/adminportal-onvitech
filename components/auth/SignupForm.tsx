'use client'; // If using App Router

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupForm() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username, // This is stored in `auth.users.user_metadata`
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      // Optional: also insert into custom `users` table
      const { error: insertError } = await supabase.from('users').insert([
        { email: form.email, username: form.username },
      ]);
      if (insertError) setMessage(insertError.message);
      else setMessage('Signup successful! Check your email for confirmation.');
    }

    setLoading(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <input
        className="w-full border p-2 mb-2"
        type="text"
        name="username"
        placeholder="Username"
        onChange={handleChange}
      />
      <input
        className="w-full border p-2 mb-2"
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />
      <input
        className="w-full border p-2 mb-2"
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSignup}
        disabled={loading}
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
      <p className="text-red-500 mt-2">{message}</p>
    </div>
  );
}
