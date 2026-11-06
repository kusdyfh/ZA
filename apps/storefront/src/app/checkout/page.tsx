'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Heading,
  Input,
  Select,
  Skeleton,
  useToast,
} from '@za/ui';
import {
  cn,
  formatCurrency,
  IRAQ_GOVERNORATE_NAMES,
  citiesForGovernorate,
} from '@za/shared';
import { ApiError } from '@/lib/api/client';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartQuery } from '@/features/cart/api';
import { useAddressesQuery } from '@/features/addresses/api';
import {
  useConfirmPhoneVerificationMutation,
  useInitiateCardCheckoutMutation,
  usePlaceOrderMutation,
  useRequestPhoneVerificationMutation,
} from '@/features/orders/api';
import { useAutoShippingMethod } from '@/features/shipping/api';

const checkoutSchema = z.object({
  customerName: z.string().min(1, 'Full name is required'),
  customerEmail: z
    .string()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  customerPhone: z.string().min(1, 'Phone number is required'),
  shippingFullName: z.string().min(1, 'Full name is required'),
  shippingPhone: z.string().min(1, 'Phone number is required'),
  shippingLine1: z.string().min(1, 'Address is required'),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(1, 'City is required'),
  shippingGovernorate: z.string().min(1, 'Governorate is required'),
  shippingCountry: z.literal('Iraq'),
  // Chosen automatically (see useAutoShippingMethod); there is no field for it.
  shippingMethodId: z
    .string()
    .min(
      1,
      "We couldn't confirm delivery to this governorate. Check the name and try again.",
    ),
  paymentMethod: z.enum(['COD', 'CARD']),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function describeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { customer } = useCustomerAuth();
  const cartToken = useCartToken();
  const { data: cart, isLoading: isCartLoading } = useCartQuery(cartToken);
  const { data: addresses } = useAddressesQuery();
  const placeOrderMutation = usePlaceOrderMutation();
  const initiateCardCheckoutMutation = useInitiateCardCheckoutMutation();
  const requestPhoneVerificationMutation =
    useRequestPhoneVerificationMutation();
  const confirmPhoneVerificationMutation =
    useConfirmPhoneVerificationMutation();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : '',
      customerEmail: customer?.email ?? '',
      customerPhone: customer?.phone ?? '',
      shippingCountry: 'Iraq',
      paymentMethod: 'COD',
    },
  });

  const shippingGovernorate = watch('shippingGovernorate');
  const customerPhone = watch('customerPhone');
  const paymentMethod = watch('paymentMethod');

  // The checkout contact phone is required and must be verified over
  // WhatsApp before the order can be placed (product decision). Tracked
  // against the exact string a code was sent/confirmed for — editing the
  // number after verifying it resets this, since the verification no
  // longer covers whatever's in the field now.
  const [codeSentFor, setCodeSentFor] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const isPhoneVerified =
    verifiedPhone !== null && verifiedPhone === customerPhone;

  useEffect(() => {
    if (verifiedPhone && verifiedPhone !== customerPhone) {
      setVerifiedPhone(null);
    }
    if (codeSentFor && codeSentFor !== customerPhone) {
      setCodeSentFor(null);
      setVerificationCode('');
      setDevCode(null);
    }
  }, [customerPhone, verifiedPhone, codeSentFor]);

  async function handleSendCode() {
    if (!customerPhone) return;
    try {
      const result =
        await requestPhoneVerificationMutation.mutateAsync(customerPhone);
      setCodeSentFor(customerPhone);
      setDevCode(result.code ?? null);
      showToast({
        tone: 'success',
        title: 'Verification code sent on WhatsApp',
      });
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not send verification code',
        description: describeError(error),
      });
    }
  }

  async function handleVerifyCode() {
    if (!customerPhone || !verificationCode) return;
    try {
      await confirmPhoneVerificationMutation.mutateAsync({
        phone: customerPhone,
        code: verificationCode,
      });
      setVerifiedPhone(customerPhone);
      showToast({ tone: 'success', title: 'Phone number verified' });
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not verify code',
        description: describeError(error),
      });
    }
  }

  // Wait for a pause in typing before asking for quotes, one request per method.
  const [typedGovernorate, setTypedGovernorate] = useState('');
  useEffect(() => {
    const timer = setTimeout(
      () => setTypedGovernorate((shippingGovernorate ?? '').trim()),
      400,
    );
    return () => clearTimeout(timer);
  }, [shippingGovernorate]);

  const {
    method: shippingMethod,
    quote: shippingQuote,
    isChecking: isQuoteLoading,
    isUnavailable: isDeliveryUnavailable,
  } = useAutoShippingMethod(typedGovernorate, cart?.subtotal ?? null);

  useEffect(() => {
    setValue('shippingMethodId', shippingMethod?.id ?? '');
  }, [shippingMethod?.id, setValue]);

  useEffect(() => {
    if (customer) {
      setValue('customerName', `${customer.firstName} ${customer.lastName}`);
      setValue('customerEmail', customer.email);
      if (customer.phone) setValue('customerPhone', customer.phone);
    }
  }, [customer, setValue]);

  const cityOptions = citiesForGovernorate(shippingGovernorate ?? '');
  const shippingGovernorateField = register('shippingGovernorate');

  function applyAddress(addressId: string) {
    const address = addresses?.find((item) => item.id === addressId);
    if (!address) return;
    setValue('shippingFullName', address.fullName);
    setValue('shippingPhone', address.phone);
    setValue('shippingLine1', address.line1);
    setValue('shippingLine2', address.line2 ?? '');
    setValue('shippingGovernorate', address.governorate);
    setValue('shippingCity', address.city);
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!isPhoneVerified) {
      showToast({
        tone: 'danger',
        title: 'Verify your phone number',
        description:
          'Send and confirm the WhatsApp code before placing the order.',
      });
      return;
    }
    try {
      if (values.paymentMethod === 'CARD') {
        // Unreachable via the UI — the CARD radio is disabled (product
        // decision, see the Payment card below) — kept type-correct rather
        // than deleted, since the backend/Stripe integration it would call
        // is untouched. `customerEmail` is optional at checkout generally
        // but Stripe still wants one for the receipt.
        const origin = window.location.origin;
        const session = await initiateCardCheckoutMutation.mutateAsync({
          ...values,
          customerEmail: values.customerEmail ?? '',
          guestToken: cartToken,
          successUrl: `${origin}/checkout/payment-result?status=success`,
          cancelUrl: `${origin}/checkout?status=cancelled`,
        });
        if (session.checkoutUrl) {
          window.location.href = session.checkoutUrl;
        }
        return;
      }
      const order = await placeOrderMutation.mutateAsync({
        ...values,
        guestToken: cartToken,
        paymentMethod: 'COD',
      });
      router.push(`/checkout/confirmation/${order.id}`);
    } catch (error) {
      showToast({
        tone: 'danger',
        title: 'Could not place order',
        description: describeError(error),
      });
    }
  });

  if (isCartLoading) {
    return (
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Skeleton className="bg-brand-blush h-96 w-full dark:bg-neutral-800" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-brand-cream dark:bg-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Your cart is empty"
            description="Add something to your cart before checking out."
            action={
              <Button
                onClick={() => router.push('/shop')}
                className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
              >
                Browse the shop
              </Button>
            }
            className="rounded-brand-lg border-brand-petal-100 bg-brand-blush/40 dark:border-neutral-700 dark:bg-transparent"
            iconClassName="text-brand-dusty dark:text-neutral-500"
          />
        </div>
      </div>
    );
  }

  const cardClassName =
    'rounded-brand-lg border-brand-petal-100 bg-brand-paper shadow-brand-tight dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none';
  const cardTitleClassName = 'text-brand-ink dark:text-neutral-50';

  return (
    <div className="bg-brand-cream dark:bg-transparent">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Heading
          level={2}
          as="h1"
          className="text-brand-ink mb-6 dark:text-neutral-50"
        >
          Checkout
        </Heading>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
            <Card className={cardClassName}>
              <CardHeader>
                <CardTitle className={cardTitleClassName}>
                  Contact information
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Input
                  label="Full name"
                  errorText={errors.customerName?.message}
                  {...register('customerName')}
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  errorText={errors.customerEmail?.message}
                  {...register('customerEmail')}
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Phone"
                    helperText="e.g. 07700000000"
                    errorText={errors.customerPhone?.message}
                    className="flex-1"
                    {...register('customerPhone')}
                  />
                  {isPhoneVerified ? (
                    <span className="text-success-500 flex h-10 items-center gap-1 whitespace-nowrap px-1 text-sm font-medium">
                      ✓ Verified
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={requestPhoneVerificationMutation.isPending}
                      disabled={!customerPhone}
                      onClick={handleSendCode}
                      className="h-10 whitespace-nowrap"
                    >
                      {codeSentFor === customerPhone
                        ? 'Resend code'
                        : 'Send code'}
                    </Button>
                  )}
                </div>

                {!isPhoneVerified && codeSentFor === customerPhone && (
                  <div className="flex items-end gap-2">
                    <Input
                      label="WhatsApp code"
                      helperText={
                        devCode
                          ? `Dev mode — code: ${devCode} (no WhatsApp account configured yet)`
                          : 'Sent to your phone over WhatsApp'
                      }
                      value={verificationCode}
                      onChange={(event) =>
                        setVerificationCode(event.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      isLoading={confirmPhoneVerificationMutation.isPending}
                      disabled={!verificationCode}
                      onClick={handleVerifyCode}
                      className="bg-brand-plum text-brand-paper hover:bg-brand-berry h-10 whitespace-nowrap"
                    >
                      Verify
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cardClassName}>
              <CardHeader>
                <CardTitle className={cardTitleClassName}>
                  Shipping address
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {customer && addresses && addresses.length > 0 && (
                  <Select
                    label="Use a saved address"
                    placeholder="Enter a new address"
                    onChange={(event) => applyAddress(event.target.value)}
                    options={addresses.map((address) => ({
                      value: address.id,
                      label: `${address.fullName} — ${address.line1}, ${address.city}`,
                    }))}
                  />
                )}
                <Input
                  label="Full name"
                  errorText={errors.shippingFullName?.message}
                  {...register('shippingFullName')}
                />
                <Input
                  label="Phone"
                  errorText={errors.shippingPhone?.message}
                  {...register('shippingPhone')}
                />
                <Input
                  label="Address line 1"
                  errorText={errors.shippingLine1?.message}
                  {...register('shippingLine1')}
                />
                <Input
                  label="Address line 2 (optional)"
                  {...register('shippingLine2')}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Governorate"
                    placeholder="Select a governorate"
                    errorText={
                      errors.shippingGovernorate?.message ??
                      (isDeliveryUnavailable
                        ? "We don't currently deliver to that governorate."
                        : errors.shippingMethodId?.message)
                    }
                    options={IRAQ_GOVERNORATE_NAMES.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    {...shippingGovernorateField}
                    onChange={(event) => {
                      void shippingGovernorateField.onChange(event);
                      setValue('shippingCity', '');
                    }}
                  />
                  <Select
                    label="City"
                    placeholder={
                      shippingGovernorate
                        ? 'Select a city'
                        : 'Select a governorate first'
                    }
                    disabled={!shippingGovernorate}
                    errorText={errors.shippingCity?.message}
                    options={cityOptions.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    {...register('shippingCity')}
                  />
                </div>
                {isQuoteLoading && (
                  <p className="text-brand-mauve text-xs dark:text-neutral-400">
                    Calculating shipping fee…
                  </p>
                )}
                <Input
                  label="Country"
                  value="Iraq"
                  disabled
                  readOnly
                  {...register('shippingCountry')}
                />
              </CardContent>
            </Card>

            <Card className={cardClassName}>
              <CardHeader>
                <CardTitle className={cardTitleClassName}>Payment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <label className="text-brand-ink flex items-center gap-2 text-sm dark:text-neutral-300">
                  <input
                    type="radio"
                    value="COD"
                    className="accent-brand-plum h-4 w-4"
                    {...register('paymentMethod')}
                  />
                  Cash on Delivery
                </label>
                {/* Card payment is disabled for now (product decision) — kept
                    visible but unselectable so customers know it's coming,
                    rather than removed; the backend/Stripe integration this
                    option would call is untouched. */}
                <label className="flex items-center gap-2 text-sm text-neutral-400 dark:text-neutral-600">
                  <input
                    type="radio"
                    value="CARD"
                    disabled
                    className="h-4 w-4 cursor-not-allowed"
                  />
                  Pay by card
                  <span className="rounded-brand-pill bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    Coming soon
                  </span>
                </label>
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              isLoading={
                placeOrderMutation.isPending ||
                initiateCardCheckoutMutation.isPending
              }
              className="rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry"
            >
              {paymentMethod === 'CARD' ? 'Continue to payment' : 'Place order'}
            </Button>
          </form>

          <Card className={cn(cardClassName, 'h-fit')}>
            <CardHeader>
              <CardTitle className={cardTitleClassName}>
                Order summary
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {cart.items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex justify-between text-sm"
                >
                  <span className="text-brand-ink dark:text-neutral-300">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="text-brand-ink font-medium dark:text-neutral-50">
                    {formatCurrency(item.lineTotal, {
                      currency: cart.currencyCode,
                    })}
                  </span>
                </div>
              ))}
              <div className="border-brand-petal-100 text-brand-ink flex justify-between border-t pt-3 text-sm dark:border-neutral-800 dark:text-neutral-300">
                <span>Subtotal</span>
                <span>
                  {formatCurrency(cart.subtotal, {
                    currency: cart.currencyCode,
                  })}
                </span>
              </div>
              <div className="text-brand-ink flex justify-between text-sm dark:text-neutral-300">
                <span>Shipping</span>
                <span>
                  {shippingQuote
                    ? formatCurrency(shippingQuote.fee, {
                        currency: cart.currencyCode,
                      })
                    : '—'}
                </span>
              </div>
              <div className="border-brand-petal-100 text-brand-ink flex justify-between border-t pt-3 font-semibold dark:border-neutral-800 dark:text-neutral-50">
                <span>Total</span>
                <span>
                  {formatCurrency(cart.subtotal + (shippingQuote?.fee ?? 0), {
                    currency: cart.currencyCode,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
