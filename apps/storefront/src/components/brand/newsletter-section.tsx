'use client';

import { useState } from 'react';
import { Button, Input } from '@za/ui';
import { IllustrationBanner } from './illustration-banner';

/**
 * No email-list/newsletter backend exists (out of this epic's scope — no
 * new API routes are added). Rather than a dead `<form>`, this validates
 * client-side and shows a clear local confirmation state — presentation
 * only, no data is sent or persisted anywhere, matching this codebase's
 * existing precedent for backend-less forms (`ContactForm`'s `mailto:`).
 */
export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isValid = email.includes('@');

  function onSubmit(event: React.FormEvent) {
    // Belt and suspenders: `handleSubscribe` (the button's own onClick) is
    // the real submission path — this only guards against the Enter key
    // triggering a native GET-to-self navigation, which would otherwise
    // reset all component state.
    event.preventDefault();
  }

  function handleSubscribe() {
    if (!isValid) return;
    setSubmitted(true);
  }

  return (
    <IllustrationBanner
      tone="newsletter"
      eyebrow="Join the club"
      title="Sweet updates, straight to your inbox"
      description="New arrivals, lifestyle stories, and the occasional sparkle-covered discount."
    >
      {submitted ? (
        <p className="font-script text-2xl text-white">Thank you! See you soon.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3 sm:flex-row" noValidate>
          <Input
            type="email"
            placeholder="you@example.com"
            aria-label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="bg-white/95"
          />
          <Button
            type="button"
            onClick={handleSubscribe}
            className="shrink-0 rounded-brand-pill bg-brand-ink text-white hover:bg-brand-ink/90"
          >
            Subscribe
          </Button>
        </form>
      )}
    </IllustrationBanner>
  );
}
