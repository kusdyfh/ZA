import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as ApiClient from '@/lib/api/client';
import { apiFetch } from '@/lib/api/client';
import { useAutoShippingMethod } from './api';

jest.mock('@/lib/api/client', () => ({
  ...jest.requireActual<typeof ApiClient>('@/lib/api/client'),
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

const methods = [
  { id: 'express', name: 'Express', minDays: 1, maxDays: 2 },
  { id: 'standard', name: 'Standard', minDays: 2, maxDays: 5 },
  { id: 'economy', name: 'Economy', minDays: 5, maxDays: 9 },
];

function mockApi(quotesByMethod: Record<string, { fee: number } | 'no-rate'>) {
  apiFetchMock.mockImplementation((path: string) => {
    if (path === '/storefront/shipping/methods')
      return Promise.resolve(methods);
    const methodId = new URL(path, 'http://x').searchParams.get('methodId')!;
    const quote = quotesByMethod[methodId];
    return quote && quote !== 'no-rate'
      ? Promise.resolve({ fee: quote.fee, estimatedDays: null })
      : Promise.reject(new Error('No rate'));
  });
}

function renderChoice(governorate: string, subtotal: number | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useAutoShippingMethod(governorate, subtotal), {
    wrapper,
  });
}

describe('useAutoShippingMethod', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('does nothing until a governorate is entered', async () => {
    mockApi({ express: { fee: 1 } });
    const { result } = renderChoice('', 10000);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled());
    expect(result.current).toEqual({
      method: null,
      quote: null,
      isChecking: false,
      isUnavailable: false,
    });
  });

  it('uses the first method, in the order listed, that delivers to the governorate', async () => {
    mockApi({
      express: 'no-rate',
      standard: { fee: 5000 },
      economy: { fee: 2000 },
    });
    const { result } = renderChoice('Baghdad', 10000);

    await waitFor(() => expect(result.current.method?.id).toBe('standard'));
    expect(result.current.quote?.fee).toBe(5000);
    expect(result.current.isUnavailable).toBe(false);
  });

  it('does not settle on a later method while an earlier one is still undecided', async () => {
    let releaseExpress: (value: { fee: number }) => void = () => undefined;
    apiFetchMock.mockImplementation((path: string) => {
      if (path === '/storefront/shipping/methods')
        return Promise.resolve(methods);
      const methodId = new URL(path, 'http://x').searchParams.get('methodId');
      if (methodId === 'express') {
        return new Promise((resolve) => {
          releaseExpress = resolve;
        });
      }
      return Promise.resolve({ fee: 100, estimatedDays: null });
    });
    const { result } = renderChoice('Baghdad', 10000);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(4));
    expect(result.current.method).toBeNull();
    expect(result.current.isChecking).toBe(true);

    releaseExpress({ fee: 900 });
    await waitFor(() => expect(result.current.method?.id).toBe('express'));
  });

  it('reports delivery as unavailable when no method has a rate for the governorate', async () => {
    mockApi({ express: 'no-rate', standard: 'no-rate', economy: 'no-rate' });
    const { result } = renderChoice('Nowhere', 10000);

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(result.current.method).toBeNull();
  });
});
