'use client';

import { useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';

export function usePageTitle(title: string) {
  const { getSetting, loading } = useCMS();
  const siteName = getSetting('site_name')?.trim();
  const trimmedTitle = title?.trim();

  useEffect(() => {
    // Don't touch the title until CMS data has loaded
    if (loading || !siteName) return;

    if (trimmedTitle && trimmedTitle !== siteName) {
      document.title = `${trimmedTitle} | ${siteName}`;
    } else {
      document.title = siteName;
    }
  }, [trimmedTitle, siteName, loading]);
}
