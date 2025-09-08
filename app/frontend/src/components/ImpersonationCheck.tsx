'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ImpersonationCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkImpersonation = () => {
      const impersonationData = sessionStorage.getItem('impersonation_mode');
      const urlParams = new URLSearchParams(window.location.search);
      const isImpersonating = urlParams.has('impersonate');

      if (!impersonationData && isImpersonating) {
        // If there's no impersonation data but the URL has the flag,
        // something went wrong - redirect to admin
        router.push('/admin');
      }
    };

    checkImpersonation();
  }, [router]);

  return null;
}