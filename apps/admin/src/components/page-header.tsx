import type { ReactNode } from 'react';
import { Heading, Text } from '@za/ui';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Heading level={3} as="h1">
          {title}
        </Heading>
        {description && (
          <Text size="sm" muted className="mt-1">
            {description}
          </Text>
        )}
      </div>
      {action}
    </div>
  );
}
