'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ErrorState, ForbiddenState, Input, Skeleton, Textarea, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import { useCmsPageQuery, useSetCmsPagePublishedMutation, useUpsertCmsPageMutation } from '@/features/cms/api';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageUrl: z.string().optional(),
  faqItems: z.array(z.object({ question: z.string().min(1, 'Required'), answer: z.string().min(1, 'Required') })),
});

type FormValues = z.infer<typeof formSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export default function CmsPageEditPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: page, isLoading, isError, error } = useCmsPageQuery(params.slug);
  const upsertMutation = useUpsertCmsPageMutation();
  const setPublishedMutation = useSetCmsPagePublishedMutation();
  const { showToast } = useToast();
  const isFaqPage = params.slug === 'faq';

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', content: '', faqItems: [] },
  });

  const faqFields = useFieldArray({ control, name: 'faqItems' });

  useEffect(() => {
    if (page) {
      reset({
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle ?? '',
        metaDescription: page.metaDescription ?? '',
        ogImageUrl: page.ogImageUrl ?? '',
        faqItems: page.faqItems ?? [],
      });
    }
  }, [page, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsertMutation.mutateAsync({
        slug: params.slug,
        title: values.title,
        content: values.content,
        faqItems: isFaqPage ? values.faqItems : undefined,
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        ogImageUrl: values.ogImageUrl || undefined,
      });
      showToast({ tone: 'success', title: 'Page saved' });
    } catch (saveError) {
      showToast({ tone: 'danger', title: 'Could not save page', description: describeError(saveError) });
    }
  });

  async function togglePublished() {
    if (!page) return;
    try {
      await setPublishedMutation.mutateAsync({ slug: params.slug, published: page.status !== 'PUBLISHED' });
      showToast({ tone: 'success', title: page.status === 'PUBLISHED' ? 'Page unpublished' : 'Page published' });
    } catch (publishError) {
      showToast({ tone: 'danger', title: 'Could not change publish state', description: describeError(publishError) });
    }
  }

  if (error instanceof ApiError && error.status === 403) {
    return (
      <div>
        <PageHeader title="Edit page" />
        <ForbiddenState />
      </div>
    );
  }

  if (isError) {
    return <ErrorState />;
  }

  if (isLoading || !page) {
    return (
      <div>
        <PageHeader title="Edit page" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={page.title}
        description={`Slug: ${page.slug}`}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={page.status === 'PUBLISHED' ? 'success' : 'neutral'}>{page.status}</Badge>
            <Button variant="outline" isLoading={setPublishedMutation.isPending} onClick={togglePublished}>
              {page.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/cms')}>
              Back to CMS
            </Button>
          </div>
        }
      />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input label="Title" errorText={errors.title?.message} {...register('title')} />
            {!isFaqPage && (
              <Textarea label="Body" rows={10} helperText="Plain text or simple Markdown." {...register('content')} />
            )}
          </CardContent>
        </Card>

        {isFaqPage && (
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {faqFields.fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        label="Question"
                        errorText={errors.faqItems?.[index]?.question?.message}
                        {...register(`faqItems.${index}.question` as const)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-6"
                      onClick={() => faqFields.remove(index)}
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <Textarea
                    label="Answer"
                    rows={2}
                    errorText={errors.faqItems?.[index]?.answer?.message}
                    {...register(`faqItems.${index}.answer` as const)}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                leadingIcon={<Plus className="h-4 w-4" />}
                onClick={() => faqFields.append({ question: '', answer: '' })}
                className="self-start"
              >
                Add question
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input label="Meta title (optional)" {...register('metaTitle')} />
            <Textarea label="Meta description (optional)" rows={2} {...register('metaDescription')} />
            <Input label="OpenGraph image URL (optional)" {...register('ogImageUrl')} />
          </CardContent>
        </Card>

        <Button type="submit" isLoading={upsertMutation.isPending} className="self-end">
          Save changes
        </Button>
      </form>
    </div>
  );
}
