'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card, Checkbox, DataTable, Dialog, ErrorState, Input, Select, Spinner, Text, Textarea, useToast } from '@za/ui';
import { PageHeader } from '@/components/page-header';
import { ApiError } from '@/lib/api/client';
import {
  useAddOrderNoteMutation,
  useAdvanceOrderStatusMutation,
  useCancelOrderMutation,
  useOrderQuery,
} from '@/features/orders/api';
import { ORDER_STATUSES, type OrderItem, type OrderNote, type OrderStatus, type OrderStatusHistoryEntry } from '@/features/orders/types';
import { useIssueRefundMutation, useOrderPaymentSummaryQuery, useVerifyManualPaymentMutation } from '@/features/payments/api';
import type { PaymentStatusHistoryEntry, PaymentTransaction, Refund } from '@/features/payments/types';
import { useShipmentsQuery } from '@/features/shipping/api';
import type { ShipmentStatus } from '@/features/shipping/types';

const STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  CONFIRMED: 'info',
  PREPARING: 'info',
  PACKED: 'info',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
};

const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  LABEL_CREATED: 'neutral',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNED: 'danger',
};

const ADVANCE_TARGETS: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURNED'];

const advanceSchema = z.object({ status: z.enum(ORDER_STATUSES), note: z.string().optional() });
const cancelSchema = z.object({ reason: z.string().min(1, 'A reason is required') });
const noteSchema = z.object({ body: z.string().min(1, 'Note cannot be empty'), isInternal: z.boolean().optional() });
const refundSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  reason: z.string().min(1, 'A reason is required'),
});

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong.';
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { data: order, isLoading, isError } = useOrderQuery(orderId);
  const { showToast } = useToast();

  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  const advanceMutation = useAdvanceOrderStatusMutation();
  const cancelMutation = useCancelOrderMutation();
  const noteMutation = useAddOrderNoteMutation();
  const { data: paymentSummary } = useOrderPaymentSummaryQuery(orderId);
  const { data: shipments } = useShipmentsQuery();
  const verifyManualPaymentMutation = useVerifyManualPaymentMutation();
  const issueRefundMutation = useIssueRefundMutation();

  const advanceForm = useForm<z.infer<typeof advanceSchema>>({ resolver: zodResolver(advanceSchema) });
  const cancelForm = useForm<z.infer<typeof cancelSchema>>({ resolver: zodResolver(cancelSchema) });
  const noteForm = useForm<z.infer<typeof noteSchema>>({ resolver: zodResolver(noteSchema) });
  const refundForm = useForm<z.infer<typeof refundSchema>>({ resolver: zodResolver(refundSchema) });

  const onAdvance = advanceForm.handleSubmit(async (values) => {
    try {
      await advanceMutation.mutateAsync({ id: orderId, ...values });
      showToast({ tone: 'success', title: 'Order status updated' });
      setIsAdvanceOpen(false);
      advanceForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not update status', description: describeError(error) });
    }
  });

  const onCancel = cancelForm.handleSubmit(async (values) => {
    try {
      await cancelMutation.mutateAsync({ id: orderId, ...values });
      showToast({ tone: 'success', title: 'Order cancelled' });
      setIsCancelOpen(false);
      cancelForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not cancel order', description: describeError(error) });
    }
  });

  const onAddNote = noteForm.handleSubmit(async (values) => {
    try {
      await noteMutation.mutateAsync({ id: orderId, ...values });
      showToast({ tone: 'success', title: 'Note added' });
      setIsNoteOpen(false);
      noteForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not add note', description: describeError(error) });
    }
  });

  async function handleVerifyManualPayment() {
    try {
      await verifyManualPaymentMutation.mutateAsync(orderId);
      showToast({ tone: 'success', title: 'Payment verified' });
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not verify payment', description: describeError(error) });
    }
  }

  const onIssueRefund = refundForm.handleSubmit(async (values) => {
    try {
      await issueRefundMutation.mutateAsync({ orderId, ...values });
      showToast({ tone: 'success', title: 'Refund issued' });
      setIsRefundOpen(false);
      refundForm.reset();
    } catch (error) {
      showToast({ tone: 'danger', title: 'Could not issue refund', description: describeError(error) });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState title="Order not found" description="It may have been deleted, or the id is wrong." />;
  }

  const canCancel = !['DELIVERED', 'CANCELLED', 'RETURNED', 'SHIPPED'].includes(order.status);
  const canVerifyManualPayment = order.paymentMethod === 'COD' && order.paymentStatus === 'AWAITING_COLLECTION';
  const shipment = shipments?.find((candidate) => candidate.orderId === order.id);

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${new Date(order.createdAt).toLocaleString()}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsNoteOpen(true)}>
              Add note
            </Button>
            {canVerifyManualPayment && (
              <Button
                variant="outline"
                isLoading={verifyManualPaymentMutation.isPending}
                onClick={handleVerifyManualPayment}
              >
                Verify manual payment
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsRefundOpen(true)}>
              Issue refund
            </Button>
            {canCancel && (
              <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
                Cancel order
              </Button>
            )}
            <Button onClick={() => setIsAdvanceOpen(true)}>Advance status</Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card>
          <Text size="sm" muted>
            Status
          </Text>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
            <Badge tone="neutral">{order.paymentMethod} · {order.paymentStatus}</Badge>
          </div>
          {order.cancelReason && (
            <Text size="sm" className="mt-2 text-danger-500">
              Reason: {order.cancelReason}
            </Text>
          )}
        </Card>
        <Card>
          <Text size="sm" muted>
            Customer
          </Text>
          <p className="font-medium text-neutral-900 dark:text-neutral-50">{order.customerNameSnapshot}</p>
          <Text size="sm" muted>
            {order.customerEmailSnapshot} · {order.customerPhoneSnapshot}
          </Text>
        </Card>
        <Card>
          <Text size="sm" muted>
            Shipment
          </Text>
          {shipment ? (
            <>
              <div className="mt-1">
                <Badge tone={SHIPMENT_STATUS_TONE[shipment.status]}>{shipment.status}</Badge>
              </div>
              <Link
                href={`/shipping/shipments/${shipment.id}`}
                className="mt-1 inline-block text-sm text-pink-600 hover:underline dark:text-pink-400"
              >
                View shipment →
              </Link>
            </>
          ) : (
            <Text size="sm" muted className="mt-1">
              Not yet available
            </Text>
          )}
        </Card>
        <Card>
          <Text size="sm" muted>
            Shipping to
          </Text>
          <p className="text-neutral-900 dark:text-neutral-50">
            {order.shippingFullName}, {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ''}, {order.shippingCity}, {order.shippingGovernorate},{' '}
            {order.shippingCountry}
          </p>
        </Card>
      </div>

      <Text size="sm" className="mb-2 font-medium">
        Items
      </Text>
      <DataTable
        columns={[
          { key: 'productNameSnapshot', header: 'Product', render: (row: OrderItem) => row.productNameSnapshot },
          { key: 'skuSnapshot', header: 'SKU', render: (row: OrderItem) => row.skuSnapshot },
          { key: 'quantity', header: 'Qty', align: 'right', render: (row: OrderItem) => row.quantity },
          { key: 'unitPrice', header: 'Unit price', align: 'right', render: (row: OrderItem) => `${order.currencyCode} ${row.unitPrice}` },
          { key: 'lineTotal', header: 'Line total', align: 'right', render: (row: OrderItem) => `${order.currencyCode} ${row.lineTotal}` },
        ]}
        rows={order.items}
        rowKey={(row) => row.id}
      />

      <div className="mt-3 flex justify-end">
        <div className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <Text size="sm" muted>Subtotal</Text>
            <Text size="sm">{order.currencyCode} {order.subtotal}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" muted>Discount</Text>
            <Text size="sm">-{order.currencyCode} {order.discountTotal}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" muted>Shipping</Text>
            <Text size="sm">{order.currencyCode} {order.shippingFee}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" muted>Tax</Text>
            <Text size="sm">{order.currencyCode} {order.taxTotal}</Text>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold dark:border-neutral-800">
            <Text>Total</Text>
            <Text>{order.currencyCode} {order.total}</Text>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Text size="sm" className="mb-2 font-medium">
            Status history
          </Text>
          <DataTable
            columns={[
              {
                key: 'status',
                header: 'Status',
                render: (row: OrderStatusHistoryEntry) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
              },
              { key: 'note', header: 'Note', render: (row: OrderStatusHistoryEntry) => row.note ?? '—' },
              { key: 'createdAt', header: 'When', render: (row: OrderStatusHistoryEntry) => new Date(row.createdAt).toLocaleString() },
            ]}
            rows={order.statusHistory}
            rowKey={(row) => row.id}
            emptyTitle="No history yet"
          />
        </div>
        <div>
          <Text size="sm" className="mb-2 font-medium">
            Notes
          </Text>
          <DataTable
            columns={[
              { key: 'body', header: 'Note', render: (row: OrderNote) => row.body },
              {
                key: 'isInternal',
                header: 'Visibility',
                render: (row: OrderNote) => (row.isInternal ? <Badge tone="neutral">Internal</Badge> : <Badge tone="info">Customer-visible</Badge>),
              },
              { key: 'createdAt', header: 'When', render: (row: OrderNote) => new Date(row.createdAt).toLocaleString() },
            ]}
            rows={order.notes}
            rowKey={(row) => row.id}
            emptyTitle="No notes yet"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Text size="sm" className="mb-2 font-medium">
            Payment transactions
          </Text>
          <DataTable
            columns={[
              { key: 'type', header: 'Type', render: (row: PaymentTransaction) => row.type },
              { key: 'provider', header: 'Provider', render: (row: PaymentTransaction) => row.provider },
              { key: 'status', header: 'Status', render: (row: PaymentTransaction) => <Badge tone="neutral">{row.status}</Badge> },
              { key: 'amount', header: 'Amount', align: 'right', render: (row: PaymentTransaction) => `${row.currencyCode} ${row.amount}` },
              { key: 'createdAt', header: 'When', render: (row: PaymentTransaction) => new Date(row.createdAt).toLocaleString() },
            ]}
            rows={paymentSummary?.transactions ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No payment transactions yet"
          />
        </div>
        <div>
          <Text size="sm" className="mb-2 font-medium">
            Payment status history
          </Text>
          <DataTable
            columns={[
              { key: 'status', header: 'Status', render: (row: PaymentStatusHistoryEntry) => <Badge tone="neutral">{row.status}</Badge> },
              { key: 'note', header: 'Note', render: (row: PaymentStatusHistoryEntry) => row.note ?? '—' },
              { key: 'createdAt', header: 'When', render: (row: PaymentStatusHistoryEntry) => new Date(row.createdAt).toLocaleString() },
            ]}
            rows={paymentSummary?.statusHistory ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No payment history yet"
          />
        </div>
      </div>

      <div className="mt-8">
        <Text size="sm" className="mb-2 font-medium">
          Refunds
        </Text>
        <DataTable
          columns={[
            { key: 'amount', header: 'Amount', align: 'right', render: (row: Refund) => `${order.currencyCode} ${row.amount}` },
            { key: 'reason', header: 'Reason', render: (row: Refund) => row.reason },
            { key: 'status', header: 'Status', render: (row: Refund) => <Badge tone="neutral">{row.status}</Badge> },
            { key: 'method', header: 'Method', render: (row: Refund) => row.method },
            { key: 'createdAt', header: 'When', render: (row: Refund) => new Date(row.createdAt).toLocaleString() },
          ]}
          rows={paymentSummary?.refunds ?? []}
          rowKey={(row) => row.id}
          emptyTitle="No refunds issued"
        />
      </div>

      <Dialog open={isAdvanceOpen} onClose={() => setIsAdvanceOpen(false)} title="Advance order status">
        <form className="flex flex-col gap-4" onSubmit={onAdvance} noValidate>
          <Select
            label="New status"
            placeholder="Choose a status"
            options={ADVANCE_TARGETS.map((value) => ({ value, label: value }))}
            {...advanceForm.register('status')}
          />
          <Input label="Note (optional)" {...advanceForm.register('note')} />
          <Button type="submit" isLoading={advanceMutation.isPending} className="self-end">
            Update status
          </Button>
        </form>
      </Dialog>

      <Dialog open={isCancelOpen} onClose={() => setIsCancelOpen(false)} title="Cancel order">
        <form className="flex flex-col gap-4" onSubmit={onCancel} noValidate>
          <Textarea label="Reason" errorText={cancelForm.formState.errors.reason?.message} {...cancelForm.register('reason')} />
          <Button type="submit" variant="destructive" isLoading={cancelMutation.isPending} className="self-end">
            Cancel order
          </Button>
        </form>
      </Dialog>

      <Dialog open={isRefundOpen} onClose={() => setIsRefundOpen(false)} title="Issue refund">
        <form className="flex flex-col gap-4" onSubmit={onIssueRefund} noValidate>
          <Input
            label="Amount"
            type="number"
            errorText={refundForm.formState.errors.amount?.message}
            {...refundForm.register('amount')}
          />
          <Textarea label="Reason" errorText={refundForm.formState.errors.reason?.message} {...refundForm.register('reason')} />
          <Button type="submit" isLoading={issueRefundMutation.isPending} className="self-end">
            Issue refund
          </Button>
        </form>
      </Dialog>

      <Dialog open={isNoteOpen} onClose={() => setIsNoteOpen(false)} title="Add a note">
        <form className="flex flex-col gap-4" onSubmit={onAddNote} noValidate>
          <Textarea label="Note" errorText={noteForm.formState.errors.body?.message} {...noteForm.register('body')} />
          <Checkbox label="Internal note (not shown to the customer)" {...noteForm.register('isInternal')} />
          <Button type="submit" isLoading={noteMutation.isPending} className="self-end">
            Add note
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
