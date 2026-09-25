import type { ReactNode } from 'react';
import { AlertTriangle, Ban, Inbox } from 'lucide-react';
import { cn } from '@za/shared';

interface StatePanelProps {
  icon: typeof Inbox;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
  /** Override the panel's container classes (merged with the default). */
  className?: string;
  /** Override the icon's classes (merged with the default). */
  iconClassName?: string;
}

function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
  iconClassName,
}: StatePanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center dark:border-neutral-700',
        className,
      )}
    >
      <Icon
        className={cn(
          'h-8 w-8',
          tone === 'danger'
            ? 'text-danger-500'
            : 'text-neutral-400 dark:text-neutral-500',
          iconClassName,
        )}
        aria-hidden="true"
      />
      <p className="font-medium text-neutral-800 dark:text-neutral-100">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Generic empty state — illustration + copy + optional primary action, per docs/09-DESIGN-SYSTEM.md §7. */
export function EmptyState(props: Omit<StatePanelProps, 'icon' | 'tone'>) {
  return <StatePanel {...props} icon={Inbox} tone="neutral" />;
}

/** Generic error state — a failed fetch, distinct from "no data yet". */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Try again, or come back later.',
  action,
}: Partial<Omit<StatePanelProps, 'icon' | 'tone'>>) {
  return (
    <StatePanel
      icon={AlertTriangle}
      title={title}
      description={description}
      action={action}
      tone="danger"
    />
  );
}

/**
 * Rendered when the API returns 403 FORBIDDEN — this app has no way to
 * know a role's permission set ahead of time (ADR 0019 §3), so every
 * nav item is always visible and this is the real, server-enforced gate.
 */
export function ForbiddenState({
  description = "You don't have permission to view this — ask an admin to grant you access.",
}: {
  description?: string;
}) {
  return (
    <StatePanel
      icon={Ban}
      title="Access denied"
      description={description}
      tone="danger"
    />
  );
}
