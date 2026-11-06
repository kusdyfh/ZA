'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button, Input, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useColorsQuery, useCreateColorMutation } from './api';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Pick any existing color as a swatch, or create a brand-new one inline
 * (free name + any shade) without leaving the form.
 */
export function ColorPicker({
  value,
  onChange,
  label = 'Color',
}: {
  value?: string | null;
  onChange: (colorId: string | undefined) => void;
  label?: string;
}) {
  const { data: colors } = useColorsQuery({ limit: 100 });
  const createMutation = useCreateColorMutation();
  const { showToast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#E8567F');
  const [error, setError] = useState<string | null>(null);

  const list = colors?.data ?? [];
  const selected = list.find((color) => color.id === value);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return setError('Give the color a name');
    if (!HEX_PATTERN.test(hex))
      return setError('Use a 6-digit hex code, e.g. #E8567F');
    const existing = list.find(
      (color) => color.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      onChange(existing.id);
      setIsAdding(false);
      setName('');
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        name: trimmed,
        hexCode: hex.toUpperCase(),
      });
      onChange(created.id);
      showToast({ tone: 'success', title: `Color "${created.name}" added` });
      setIsAdding(false);
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add color.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {label}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {selected ? selected.name : 'No color'}
        </span>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label={label}
      >
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          title="No color"
          onClick={() => onChange(undefined)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-neutral-400 dark:bg-neutral-900 ${
            !value
              ? 'border-pink-500 ring-2 ring-pink-500/30'
              : 'border-neutral-300 dark:border-neutral-600'
          }`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {list.map((color) => {
          const isSelected = color.id === value;
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.name}
              title={`${color.name} (${color.hexCode})`}
              onClick={() => onChange(color.id)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                isSelected
                  ? 'border-pink-500 ring-2 ring-pink-500/30'
                  : 'border-neutral-300 dark:border-neutral-600'
              }`}
              style={{ backgroundColor: color.hexCode }}
            >
              {isSelected && (
                <Check
                  className="h-4 w-4 text-white mix-blend-difference"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
        {!isAdding && (
          <button
            type="button"
            title="New color"
            aria-label="Add a new color"
            onClick={() => setIsAdding(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-neutral-400 text-neutral-500 hover:border-pink-500 hover:text-pink-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {isAdding && (
        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Shade
              </span>
              <input
                type="color"
                value={HEX_PATTERN.test(hex) ? hex : '#000000'}
                onChange={(event) => {
                  setHex(event.target.value.toUpperCase());
                  setError(null);
                }}
                className="h-10 w-12 cursor-pointer rounded-sm border border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
                aria-label="Pick a shade"
              />
            </label>
            <div className="w-28">
              <Input
                label="Hex"
                value={hex}
                onChange={(event) => {
                  setHex(event.target.value.trim());
                  setError(null);
                }}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Name"
                placeholder="e.g. وردي فاتح / Dusty Rose"
                value={name}
                autoFocus
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleAdd();
                  }
                }}
              />
            </div>
          </div>
          {error && <p className="text-danger-500 text-xs">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={createMutation.isPending}
              onClick={() => void handleAdd()}
            >
              Add &amp; select
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
