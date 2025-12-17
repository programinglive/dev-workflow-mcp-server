'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import History from "@/components/History";
import ApiReference from "@/components/ApiReference";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main>
      <Hero />
      <Features />
      <History />
      <ApiReference />
    </main>
  );
}
