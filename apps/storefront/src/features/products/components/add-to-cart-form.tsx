'use client';

import { useState } from 'react';
import { Button, QuantityStepper, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartDrawer } from '@/lib/cart/cart-drawer-context';
import { useAddCartItemMutation } from '@/features/cart/api';
import type { ProductVariant } from '../types';
import { VariantPicker } from './variant-picker';

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export interface AddToCartFormProps {
  variants: ProductVariant[];
  /** Controlled color, so the gallery can follow it. Uncontrolled when omitted. */
  selectedColorId?: string | null;
  onSelectColor?: (colorId: string) => void;
}

export function AddToCartForm({
  variants,
  selectedColorId: controlledColorId,
  onSelectColor,
}: AddToCartFormProps) {
  const cartToken = useCartToken();
  const { open } = useCartDrawer();
  const addMutation = useAddCartItemMutation(cartToken);
  const { showToast } = useToast();

  const [ownColorId, setOwnColorId] = useState<string | null>(
    variants[0]?.colorId ?? null,
  );
  const selectedColorId =
    controlledColorId !== undefined ? controlledColorId : ownColorId;
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    variants[0]?.sizeId ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  function handleSelectColor(colorId: string) {
    setOwnColorId(colorId);
    onSelectColor?.(colorId);
    // Keep the size when this color has it; otherwise fall to its first size.
    const sizesForColor = variants
      .filter((variant) => variant.colorId === colorId)
      .map((variant) => variant.sizeId ?? null);
    if (!sizesForColor.includes(selectedSizeId)) {
      setSelectedSizeId(sizesForColor[0] ?? null);
    }
  }

  const selectedVariant = variants.find(
    (variant) =>
      (variant.colorId ?? null) === selectedColorId &&
      (variant.sizeId ?? null) === selectedSizeId,
  );

  async function handleAddToCart() {
    if (!selectedVariant) {
      showToast({
        tone: 'danger',
        title: 'Choose an option',
        description: 'Select a color and size before adding to cart.',
      });
      return;
    }
    try {
      await addMutation.mutateAsync({
        variantId: selectedVariant.id,
        quantity,
      });
      showToast({ tone: 'success', title: 'Added to cart' });
      open();
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not add to cart',
        description: describeError(error),
      });
    }
  }

  if (variants.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        This product isn&apos;t available for purchase right now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <VariantPicker
        variants={variants}
        selectedColorId={selectedColorId}
        selectedSizeId={selectedSizeId}
        onSelectColor={handleSelectColor}
        onSelectSize={setSelectedSizeId}
      />
      <div className="flex items-center gap-4">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button
          onClick={handleAddToCart}
          isLoading={addMutation.isPending}
          disabled={!selectedVariant}
          className="flex-1"
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}
