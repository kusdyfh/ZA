'use client';

import { useRouter } from 'next/navigation';
import { Button, ErrorState } from '@za/ui';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
      <ErrorState
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={<Button onClick={() => router.push('/')}>Back to homepage</Button>}
      />
    </div>
  );
}
