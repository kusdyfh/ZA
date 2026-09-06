'use client';

import { useEffect } from 'react';
import { Button, ErrorState } from '@za/ui';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
