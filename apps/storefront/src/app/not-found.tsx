'use client';

import { useRouter } from 'next/navigation';
import { Button, ErrorState } from '@za/ui';

export default function NotFound() {
  const router = useRouter();

  return (
    // Brand-token skin matching the rest of the theme-aware chrome (ADR 0029 §11).
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-lg px-4 py-24 sm:px-6">
        <ErrorState
          title="Page not found"
          description="The page you're looking for doesn't exist or may have moved."
          action={
            <Button
              onClick={() => router.push('/')}
              className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
            >
              Back to homepage
            </Button>
          }
          iconClassName="text-brand-dusty dark:text-neutral-500"
        />
      </div>
    </div>
  );
}
