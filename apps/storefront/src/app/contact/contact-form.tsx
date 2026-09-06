'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input, Textarea } from '@za/ui';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  message: z.string().min(1, 'Message is required'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const SUPPORT_EMAIL = 'support@za-store.example';

/**
 * No backend endpoint exists for contact-form submissions (out of this
 * epic's scope — Notifications/support-ticketing isn't built). Rather
 * than fabricating a submission handler, this opens the visitor's own
 * mail client with the message pre-filled — a real send, just not one
 * this app's API is involved in.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = handleSubmit((values) => {
    const subject = encodeURIComponent(`Message from ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Name"
        errorText={errors.name?.message}
        labelClassName="text-brand-ink dark:text-brand-ink"
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        errorText={errors.email?.message}
        labelClassName="text-brand-ink dark:text-brand-ink"
        {...register('email')}
      />
      <Textarea
        label="Message"
        rows={5}
        errorText={errors.message?.message}
        labelClassName="text-brand-ink dark:text-brand-ink"
        {...register('message')}
      />
      <Button type="submit" className="self-end rounded-brand-pill bg-brand-blush-600 hover:bg-brand-blush-700">
        Send message
      </Button>
    </form>
  );
}
