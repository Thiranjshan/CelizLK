'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function AuthBootstrap() {
  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);
  const setAuthInitialized = useStore((state) => state.setAuthInitialized);

  useEffect(() => {
    fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data) {
          setUser(data.user);
          setAccessToken(data.accessToken);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setAuthInitialized(true);
      });
  }, [setAccessToken, setUser, setAuthInitialized]);

  return null;
}