'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { Button, EmptyState, Rating, Skeleton, Textarea, useToast } from '@za/ui';
import { cn } from '@za/shared';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';
import { useProductReviewsQuery, useSubmitReviewMutation } from '../api';

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
  body: z.string().max(2000).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function RatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className={cn('h-6 w-6', star <= value ? 'fill-warning-500 text-warning-500' : 'text-neutral-300 dark:text-neutral-700')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const { isAuthenticated } = useCustomerAuth();
  const { data, isLoading } = useProductReviewsQuery(productId);
  const submitMutation = useSubmitReviewMutation(productId);
  const { showToast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0 } });

  const rating = watch('rating');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitMutation.mutateAsync(values);
      showToast({ tone: 'success', title: 'Review submitted', description: 'It will appear once approved.' });
      reset({ rating: 0, body: '' });
      setIsFormOpen(false);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not submit review', description: describeError(error) });
    }
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const reviews = data?.reviews ?? [];
  const summary = data?.summary;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Rating value={summary?.averageRating ?? 0} count={summary?.reviewCount ?? 0} size="md" />
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Reviews</h2>
        </div>
        {isAuthenticated ? (
          <Button variant="outline" onClick={() => setIsFormOpen((value) => !value)}>
            Write a review
          </Button>
        ) : (
          <Link href="/login" className="text-sm font-medium text-pink-700 hover:underline dark:text-pink-300">
            Sign in to write a review
          </Link>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={onSubmit} noValidate className="mb-8 flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-800 dark:text-neutral-200">Your rating</p>
            <RatingInput value={rating} onChange={(value) => setValue('rating', value, { shouldValidate: true })} />
            {errors.rating && <p className="mt-1 text-xs text-danger-500">{errors.rating.message}</p>}
          </div>
          <Textarea
            label="Your review (optional)"
            placeholder="Tell other customers what you think..."
            onChange={(event) => setValue('body', event.target.value)}
          />
          <Button type="submit" isLoading={submitMutation.isPending} className="self-end">
            Submit review
          </Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Be the first to share your thoughts on this product." />
      ) : (
        <ul className="flex flex-col gap-6">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-neutral-200 pb-6 last:border-0 dark:border-neutral-800">
              <Rating value={review.rating} size="sm" />
              {review.body && <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{review.body}</p>}
              <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
