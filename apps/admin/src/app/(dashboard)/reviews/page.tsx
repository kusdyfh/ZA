'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Check, Star, X } from 'lucide-react';
import { Badge, Button, Callout, DataTable, Dialog, ErrorState, ForbiddenState, Textarea, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useModerateReviewMutation, usePendingReviewsQuery } from '@/features/reviews/api';
import type { Review } from '@/features/reviews/types';

const rejectSchema = z.object({ rejectionReason: z.string().min(1, 'A reason is required') });

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={index < rating ? 'h-4 w-4 fill-warning-500 text-warning-500' : 'h-4 w-4 text-neutral-300 dark:text-neutral-700'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { data: reviews, isLoading, isError, error } = usePendingReviewsQuery();
  const moderateMutation = useModerateReviewMutation();
  const { showToast } = useToast();
  const [rejectingReview, setRejectingReview] = useState<Review | null>(null);

  const rejectForm = useForm<z.infer<typeof rejectSchema>>({ resolver: zodResolver(rejectSchema) });

  async function handleApprove(review: Review) {
    try {
      await moderateMutation.mutateAsync({ id: review.id, approve: true });
      showToast({ tone: 'success', title: 'Review approved' });
    } catch (moderationError) {
      showToast({ tone: 'danger', title: 'Could not approve review', description: describeError(moderationError) });
    }
  }

  const onReject = rejectForm.handleSubmit(async (values) => {
    if (!rejectingReview) return;
    try {
      await moderateMutation.mutateAsync({ id: rejectingReview.id, approve: false, ...values });
      showToast({ tone: 'success', title: 'Review rejected' });
      setRejectingReview(null);
      rejectForm.reset();
    } catch (moderationError) {
      showToast({ tone: 'danger', title: 'Could not reject review', description: describeError(moderationError) });
    }
  });

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div>
        <PageHeader title="Reviews" />
        <ForbiddenState />
      </div>
    );
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div>
      <PageHeader title="Reviews" description="Moderation queue — approve or reject reviews awaiting review." />
      <Callout className="mb-4">
        There&apos;s no endpoint for already-approved/rejected reviews — this is a moderation queue, not a full
        history browser.
      </Callout>
      <DataTable
        columns={[
          { key: 'rating', header: 'Rating', render: (row: Review) => <Stars rating={row.rating} /> },
          { key: 'body', header: 'Review', render: (row: Review) => row.body ?? <span className="italic text-neutral-400">No written review</span> },
          { key: 'productId', header: 'Product ID', render: (row: Review) => <span className="font-mono text-xs">{row.productId}</span> },
          { key: 'status', header: 'Status', render: () => <Badge tone="warning">PENDING</Badge> },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row: Review) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" leadingIcon={<Check className="h-4 w-4" />} onClick={() => handleApprove(row)}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" leadingIcon={<X className="h-4 w-4" />} onClick={() => setRejectingReview(row)}>
                  Reject
                </Button>
              </div>
            ),
          },
        ]}
        rows={reviews ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="Nothing to moderate"
        emptyDescription="New customer reviews will show up here for approval."
      />

      <Dialog open={rejectingReview !== null} onClose={() => setRejectingReview(null)} title="Reject review">
        <form className="flex flex-col gap-4" onSubmit={onReject} noValidate>
          <Textarea
            label="Rejection reason"
            errorText={rejectForm.formState.errors.rejectionReason?.message}
            {...rejectForm.register('rejectionReason')}
          />
          <Button type="submit" variant="destructive" isLoading={moderateMutation.isPending} className="self-end">
            Reject review
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
