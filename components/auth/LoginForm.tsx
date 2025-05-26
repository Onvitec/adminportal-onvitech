'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) setMessage(error.message);
    else setMessage('Login successful!');

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
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
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      <p className="text-red-500 mt-2">{message}</p>
    </div>
  );
}
