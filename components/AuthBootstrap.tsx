'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function AuthBootstrap() {
  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);

  useEffect(() => {
    fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data) {
          setUser(data.user);
          setAccessToken(data.accessToken);
        }
      })
      .catch(() => undefined);
  }, [setAccessToken, setUser]);

  return null;
}