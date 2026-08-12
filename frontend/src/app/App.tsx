import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';
import type { HealthResponse } from '@/types';

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <h1>da-forms</h1>
      {error && <p>API error: {error}</p>}
      {health && <p>API status: {health.status}</p>}
    </main>
  );
}
