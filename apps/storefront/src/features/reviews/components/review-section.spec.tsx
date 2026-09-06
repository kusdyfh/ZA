import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewSection } from './review-section';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useProductReviewsQuery, useSubmitReviewMutation } from '../api';
import { useToast } from '@za/ui';
import type * as ZaUi from '@za/ui';

jest.mock('@/lib/auth/auth-context', () => ({
  useCustomerAuth: jest.fn(),
}));

jest.mock('../api', () => ({
  useProductReviewsQuery: jest.fn(),
  useSubmitReviewMutation: jest.fn(),
}));

jest.mock('@za/ui', () => ({
  ...jest.requireActual<typeof ZaUi>('@za/ui'),
  useToast: jest.fn(),
}));

const useCustomerAuthMock = useCustomerAuth as jest.Mock;
const useProductReviewsQueryMock = useProductReviewsQuery as jest.Mock;
const useSubmitReviewMutationMock = useSubmitReviewMutation as jest.Mock;
const useToastMock = useToast as jest.Mock;

describe('ReviewSection', () => {
  const mutateAsync = jest.fn();
  const showToast = jest.fn();

  beforeEach(() => {
    mutateAsync.mockClear();
    showToast.mockClear();
    useSubmitReviewMutationMock.mockReturnValue({ mutateAsync, isPending: false });
    useToastMock.mockReturnValue({ showToast });
  });

  it('shows a sign-in prompt instead of the review form when signed out', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false });
    useProductReviewsQueryMock.mockReturnValue({ data: { reviews: [], summary: { averageRating: 0, reviewCount: 0 } }, isLoading: false });

    render(<ReviewSection productId="product-1" />);

    expect(screen.getByRole('link', { name: 'Sign in to write a review' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Write a review' })).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no reviews yet', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true });
    useProductReviewsQueryMock.mockReturnValue({ data: { reviews: [], summary: { averageRating: 0, reviewCount: 0 } }, isLoading: false });

    render(<ReviewSection productId="product-1" />);

    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('lists existing reviews', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true });
    useProductReviewsQueryMock.mockReturnValue({
      data: {
        reviews: [{ id: 'review-1', rating: 5, body: 'Great fit and fabric.', createdAt: '2026-01-01T00:00:00.000Z' }],
        summary: { averageRating: 5, reviewCount: 1 },
      },
      isLoading: false,
    });

    render(<ReviewSection productId="product-1" />);

    expect(screen.getByText('Great fit and fabric.')).toBeInTheDocument();
  });

  it('requires a star rating before the review can be submitted', async () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true });
    useProductReviewsQueryMock.mockReturnValue({ data: { reviews: [], summary: { averageRating: 0, reviewCount: 0 } }, isLoading: false });
    const user = userEvent.setup();

    render(<ReviewSection productId="product-1" />);
    await user.click(screen.getByRole('button', { name: 'Write a review' }));
    await user.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(await screen.findByText('Choose a rating')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits the chosen rating and shows a success toast', async () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true });
    useProductReviewsQueryMock.mockReturnValue({ data: { reviews: [], summary: { averageRating: 0, reviewCount: 0 } }, isLoading: false });
    mutateAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ReviewSection productId="product-1" />);
    await user.click(screen.getByRole('button', { name: 'Write a review' }));
    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ rating: 4 }));
    expect(await screen.findByRole('button', { name: 'Write a review' })).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ tone: 'success' }));
  });
});
