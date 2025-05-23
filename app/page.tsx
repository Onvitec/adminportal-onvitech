'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();

  // useEffect(() => {
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  //     if (event === 'SIGNED_IN') {
  //       router.replace('/dashboard');
  //     } else if (event === 'SIGNED_OUT') {
  //       router.replace('/login');
  //     }
  //   });

  //   // Initial check
  //   supabase.auth.getSession().then(({ data }) => {
  //     if (data.session) {
  //       router.replace('/dashboard');
  //     } else {
  //       router.replace('/login');
  //     }
  //   });

  //   return () => subscription?.unsubscribe();
  // }, [router]);

  return null;
}