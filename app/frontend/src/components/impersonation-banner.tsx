'use client';

import { useEffect, useState } from 'react';

const ImpersonationBanner = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  useEffect(() => {
    // Check if we're in impersonation mode via URL or session
    const checkImpersonation = () => {
      const urlHasImpersonation = window.location.search.includes('__clerk_impersonation');
      const sessionHasImpersonation = sessionStorage.getItem('clerk_impersonation');
      setIsImpersonating(urlHasImpersonation || !!sessionHasImpersonation);
    };
    
    checkImpersonation();
  }, []);
  
  if (!isImpersonating) return null;
  
  return (
    <div className="bg-yellow-500 text-white px-4 py-2 text-center">
      You are in impersonation mode. 
      <button 
        onClick={() => {
          sessionStorage.removeItem('clerk_impersonation');
          window.location.href = '/admin';
        }}
        className="ml-2 underline"
      >
        Exit Impersonation
      </button>
    </div>
  );
};

export default ImpersonationBanner;