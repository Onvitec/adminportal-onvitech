'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/signup');
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return <div className="p-4">Welcome to Dashboard gyu</div>;
}