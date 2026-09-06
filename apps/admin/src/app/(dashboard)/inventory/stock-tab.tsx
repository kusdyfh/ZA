'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PackagePlus, Settings2, Undo2, Wrench } from 'lucide-react';
import { Badge, Button, Callout, Card, DataTable, Dialog, Input, Select, Text, useToast } from '@za/ui';
import { ApiError } from '@/lib/api/client';
import {
  type AdjustReason,
  type ReturnDisposition,
  type StockMovement,
  useAdjustStockMutation,
  useReceiveStockMutation,
  useReturnStockMutation,
  useSetLowStockThresholdMutation,
  useVariantMovementsQuery,
  useVariantStockQuery,
} from '@/features/inventory/api';

const ADJUST_REASONS: AdjustReason[] = ['STOCKTAKE_CORRECTION', 'DAMAGED', 'FOUND', 'OTHER'];
const RETURN_DISPOSITIONS: ReturnDisposition[] = ['RESELLABLE', 'DAMAGED'];

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

const receiveSchema = z.object({ quantity: z.coerce.number().int().positive(), note: z.string().optional() });
const adjustSchema = z.object({
  quantity: z.coerce.number().int().refine((value) => value !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['STOCKTAKE_CORRECTION', 'DAMAGED', 'FOUND', 'OTHER']),
  note: z.string().optional(),
});
const returnSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  disposition: z.enum(['RESELLABLE', 'DAMAGED']),
  note: z.string().optional(),
});
const thresholdSchema = z.object({ threshold: z.coerce.number().int().min(0).optional() });

export function StockTab() {
  const [lookedUpVariantId, setLookedUpVariantId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [activeDialog, setActiveDialog] = useState<'receive' | 'adjust' | 'return' | 'threshold' | null>(null);
  const { showToast } = useToast();

  const stockQuery = useVariantStockQuery(lookedUpVariantId, warehouseId || undefined);
  const movementsQuery = useVariantMovementsQuery(lookedUpVariantId);
  const receiveMutation = useReceiveStockMutation();
  const adjustMutation = useAdjustStockMutation();
  const returnMutation = useReturnStockMutation();
  const thresholdMutation = useSetLowStockThresholdMutation();

  const receiveForm = useForm<z.infer<typeof receiveSchema>>({ resolver: zodResolver(receiveSchema) });
  const adjustForm = useForm<z.infer<typeof adjustSchema>>({ resolver: zodResolver(adjustSchema) });
  const returnForm = useForm<z.infer<typeof returnSchema>>({ resolver: zodResolver(returnSchema) });
  const thresholdForm = useForm<z.infer<typeof thresholdSchema>>({ resolver: zodResolver(thresholdSchema) });

  function lookUp() {
    setLookedUpVariantId(variantId.trim());
  }

  const onReceive = receiveForm.handleSubmit(async (values) => {
    try {
      await receiveMutation.mutateAsync({ variantId: lookedUpVariantId, warehouseId: warehouseId || undefined, ...values });
      showToast({ tone: 'success', title: 'Stock received' });
      setActiveDialog(null);
      receiveForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not receive stock', description: describeError(error) });
    }
  });

  const onAdjust = adjustForm.handleSubmit(async (values) => {
    try {
      await adjustMutation.mutateAsync({ variantId: lookedUpVariantId, warehouseId: warehouseId || undefined, ...values });
      showToast({ tone: 'success', title: 'Stock adjusted' });
      setActiveDialog(null);
      adjustForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not adjust stock', description: describeError(error) });
    }
  });

  const onReturn = returnForm.handleSubmit(async (values) => {
    try {
      await returnMutation.mutateAsync({ variantId: lookedUpVariantId, warehouseId: warehouseId || undefined, ...values });
      showToast({ tone: 'success', title: 'Return processed' });
      setActiveDialog(null);
      returnForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not process return', description: describeError(error) });
    }
  });

  const onSetThreshold = thresholdForm.handleSubmit(async (values) => {
    try {
      await thresholdMutation.mutateAsync({
        variantId: lookedUpVariantId,
        warehouseId: warehouseId || undefined,
        threshold: values.threshold ?? null,
      });
      showToast({ tone: 'success', title: 'Low-stock threshold updated' });
      setActiveDialog(null);
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update threshold', description: describeError(error) });
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <Callout>
        There&apos;s no product/variant search endpoint yet — copy a variant&apos;s ID from its product&apos;s Variants tab
        (the copy icon next to each row) and paste it here.
      </Callout>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Variant ID"
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          className="max-w-md"
          placeholder="Paste a variant ID"
        />
        <Input
          label="Warehouse ID (optional)"
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
          className="max-w-xs"
          placeholder="Default warehouse"
        />
        <Button onClick={lookUp} disabled={!variantId.trim()}>
          Look up
        </Button>
      </div>

      {lookedUpVariantId && (
        <>
          {stockQuery.isError ? (
            <Text className="text-danger-500">Could not find stock for that variant.</Text>
          ) : (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-8">
                  <div>
                    <Text size="sm" muted>
                      On hand
                    </Text>
                    <p className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {stockQuery.data?.quantity ?? '—'}
                    </p>
                  </div>
                  <div>
                    <Text size="sm" muted>
                      Available
                    </Text>
                    <p className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {stockQuery.data?.available ?? '—'}
                    </p>
                  </div>
                  <div>
                    <Text size="sm" muted>
                      Threshold
                    </Text>
                    <p className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {stockQuery.data?.lowStockThreshold ?? '—'}
                    </p>
                  </div>
                  {stockQuery.data?.isLowStock && <Badge tone="warning">Low stock</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" leadingIcon={<PackagePlus className="h-4 w-4" />} onClick={() => setActiveDialog('receive')}>
                    Receive
                  </Button>
                  <Button size="sm" variant="outline" leadingIcon={<Wrench className="h-4 w-4" />} onClick={() => setActiveDialog('adjust')}>
                    Adjust
                  </Button>
                  <Button size="sm" variant="outline" leadingIcon={<Undo2 className="h-4 w-4" />} onClick={() => setActiveDialog('return')}>
                    Return
                  </Button>
                  <Button size="sm" variant="outline" leadingIcon={<Settings2 className="h-4 w-4" />} onClick={() => setActiveDialog('threshold')}>
                    Threshold
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Text size="sm" className="mt-2 font-medium">
            Movement history
          </Text>
          <DataTable
            columns={[
              { key: 'type', header: 'Type', render: (row: StockMovement) => row.type },
              { key: 'quantity', header: 'Quantity', align: 'right', render: (row: StockMovement) => row.quantity },
              { key: 'resultingStock', header: 'Resulting stock', align: 'right', render: (row: StockMovement) => row.resultingStock },
              { key: 'reason', header: 'Reason', render: (row: StockMovement) => row.reason ?? '—' },
              { key: 'note', header: 'Note', render: (row: StockMovement) => row.note ?? '—' },
              { key: 'createdAt', header: 'When', render: (row: StockMovement) => new Date(row.createdAt).toLocaleString() },
            ]}
            rows={movementsQuery.data ?? []}
            rowKey={(row) => row.id}
            isLoading={movementsQuery.isLoading}
            emptyTitle="No movements yet"
          />
        </>
      )}

      <Dialog open={activeDialog === 'receive'} onClose={() => setActiveDialog(null)} title="Receive stock">
        <form className="flex flex-col gap-4" onSubmit={onReceive} noValidate>
          <Input label="Quantity" type="number" errorText={receiveForm.formState.errors.quantity?.message} {...receiveForm.register('quantity')} />
          <Input label="Note (optional)" {...receiveForm.register('note')} />
          <Button type="submit" isLoading={receiveMutation.isPending} className="self-end">
            Receive
          </Button>
        </form>
      </Dialog>

      <Dialog open={activeDialog === 'adjust'} onClose={() => setActiveDialog(null)} title="Adjust stock">
        <form className="flex flex-col gap-4" onSubmit={onAdjust} noValidate>
          <Input
            label="Quantity (use a negative number to reduce)"
            type="number"
            errorText={adjustForm.formState.errors.quantity?.message}
            {...adjustForm.register('quantity')}
          />
          <Select label="Reason" options={ADJUST_REASONS.map((value) => ({ value, label: value }))} {...adjustForm.register('reason')} />
          <Input label="Note (optional)" {...adjustForm.register('note')} />
          <Button type="submit" isLoading={adjustMutation.isPending} className="self-end">
            Adjust
          </Button>
        </form>
      </Dialog>

      <Dialog open={activeDialog === 'return'} onClose={() => setActiveDialog(null)} title="Process a return">
        <form className="flex flex-col gap-4" onSubmit={onReturn} noValidate>
          <Input label="Quantity" type="number" errorText={returnForm.formState.errors.quantity?.message} {...returnForm.register('quantity')} />
          <Select
            label="Disposition"
            options={RETURN_DISPOSITIONS.map((value) => ({ value, label: value }))}
            {...returnForm.register('disposition')}
          />
          <Input label="Note (optional)" {...returnForm.register('note')} />
          <Button type="submit" isLoading={returnMutation.isPending} className="self-end">
            Process return
          </Button>
        </form>
      </Dialog>

      <Dialog open={activeDialog === 'threshold'} onClose={() => setActiveDialog(null)} title="Set low-stock threshold">
        <form className="flex flex-col gap-4" onSubmit={onSetThreshold} noValidate>
          <Input
            label="Threshold"
            type="number"
            helperText="Leave blank to clear the threshold"
            {...thresholdForm.register('threshold')}
          />
          <Button type="submit" isLoading={thresholdMutation.isPending} className="self-end">
            Save
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
