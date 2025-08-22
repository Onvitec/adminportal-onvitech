'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/session-provider';

export default function HomePage() {
  const router = useRouter();
  const { isLoading, user } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      if (window.location.pathname !== '/login') {
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  return null;
}