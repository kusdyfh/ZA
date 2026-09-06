'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@za/shared';

export interface AccordionItem {
  key: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow more than one item open at once. Default: only one at a time. */
  allowMultiple?: boolean;
  defaultOpenKeys?: string[];
  className?: string;
  /** Override the item title button's text classes (merged with the default). */
  buttonClassName?: string;
  /** Override the expanded panel's text classes (merged with the default). */
  panelClassName?: string;
}

/** Collapsible sections — PDP specifications, FAQ. Keyboard- and screen-reader-accessible. */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenKeys = [],
  className,
  buttonClassName,
  panelClassName,
}: AccordionProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(defaultOpenKeys));

  function toggle(key: string) {
    setOpenKeys((current) => {
      const next = allowMultiple ? new Set(current) : new Set<string>();
      if (current.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className={cn('divide-y divide-neutral-200 dark:divide-neutral-800', className)}>
      {items.map((item) => {
        const isOpen = openKeys.has(item.key);
        const panelId = `accordion-panel-${item.key}`;
        const buttonId = `accordion-button-${item.key}`;
        return (
          <div key={item.key}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.key)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 py-4 text-start text-sm font-medium text-neutral-900 hover:text-pink-700 dark:text-neutral-100 dark:hover:text-pink-300',
                  buttonClassName,
                )}
              >
                {item.title}
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn('pb-4 text-sm text-neutral-600 dark:text-neutral-400', panelClassName)}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
