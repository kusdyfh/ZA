'use client';

import { useEffect } from 'react';
import { Button, ErrorState } from '@za/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    // Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11).
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
        <ErrorState
          title="Something went wrong"
          description="An unexpected error occurred. Please try again."
          action={
            <Button
              onClick={reset}
              className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
            >
              Try again
            </Button>
          }
          iconClassName="text-brand-dusty dark:text-neutral-500"
        />
      </div>
    </div>
  );
}
