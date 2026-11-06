import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as ZaUi from '@za/ui';
import NewProductPage from './page';
import { useCreateProductMutation } from '@/features/products/api';
import { useAllCategoriesQuery } from '@/features/categories/api';
import { useBrandsQuery } from '@/features/brands/api';

const pushMock = jest.fn();
const showToastMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@za/ui', () => {
  const actual = jest.requireActual<typeof ZaUi>('@za/ui');
  return {
    ...actual,
    useToast: () => ({ showToast: showToastMock }),
  };
});

jest.mock('@/features/products/api', () => ({
  useCreateProductMutation: jest.fn(),
}));

jest.mock('@/features/categories/api', () => ({
  useAllCategoriesQuery: jest.fn(),
}));

jest.mock('@/features/brands/api', () => ({
  useBrandsQuery: jest.fn(),
}));

const useCreateProductMutationMock = useCreateProductMutation as jest.Mock;
const useAllCategoriesQueryMock = useAllCategoriesQuery as jest.Mock;
const useBrandsQueryMock = useBrandsQuery as jest.Mock;

function renderPage() {
  return render(<NewProductPage />);
}

describe('NewProductPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    showToastMock.mockClear();
    useAllCategoriesQueryMock.mockReturnValue({
      data: { data: [{ id: 'cat-1', name: 'Scrubs' }] },
    });
    useBrandsQueryMock.mockReturnValue({ data: { data: [] } });
  });

  it('does not render a Slug input — the backend generates it automatically', () => {
    useCreateProductMutationMock.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    renderPage();

    expect(screen.queryByLabelText(/slug/i)).not.toBeInTheDocument();
  });

  it('submits a new product without a slug field in the payload', async () => {
    let submittedValues: Record<string, unknown> | undefined;
    const mutateAsync = jest.fn((values: Record<string, unknown>) => {
      submittedValues = values;
      return Promise.resolve({ id: 'prod-1' });
    });
    useCreateProductMutationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText('Name'), 'Classic V-Neck Scrub Top');
    await user.type(screen.getByLabelText('SKU'), 'ZA-TOP-001');
    await user.type(screen.getByLabelText('Price'), '45000');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(submittedValues).not.toHaveProperty('slug');
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/products/prod-1'),
    );
  });

  it('submits an empty placements array when no homepage section is checked', async () => {
    let submittedValues: Record<string, unknown> | undefined;
    const mutateAsync = jest.fn((values: Record<string, unknown>) => {
      submittedValues = values;
      return Promise.resolve({ id: 'prod-1' });
    });
    useCreateProductMutationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText('Name'), 'Classic V-Neck Scrub Top');
    await user.type(screen.getByLabelText('SKU'), 'ZA-TOP-001');
    await user.type(screen.getByLabelText('Price'), '45000');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(submittedValues?.placements).toEqual([]);
  });

  it('submits the checked homepage placements', async () => {
    let submittedValues: Record<string, unknown> | undefined;
    const mutateAsync = jest.fn((values: Record<string, unknown>) => {
      submittedValues = values;
      return Promise.resolve({ id: 'prod-1' });
    });
    useCreateProductMutationMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText('Name'), 'Classic V-Neck Scrub Top');
    await user.type(screen.getByLabelText('SKU'), 'ZA-TOP-001');
    await user.type(screen.getByLabelText('Price'), '45000');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
    await user.click(screen.getByLabelText('Home Hero'));
    await user.click(screen.getByLabelText('The Book (ZA Edit)'));
    await user.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(submittedValues?.placements).toEqual(['HOME_HERO', 'ZA_EDIT_BOOK']);
  });
});
