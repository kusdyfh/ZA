import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { requireCustomerId } from './require-customer-id';
import { SubmitReviewUseCase } from '../application/use-cases/submit-review.use-case';
import { ListProductReviewsUseCase } from '../application/use-cases/list-product-reviews.use-case';
import { SubmitReviewDto } from '../application/dto/submit-review.dto';
import { ReviewResponseDto } from '../application/dto/review-response.dto';

/**
 * Product reviews — docs/product/13-REVIEWS.md. Reads are public
 * (approved-only, plus the live average/count); submitting/editing
 * requires a logged-in customer. Moderation lives in
 * `ReviewModerationController` (staff-guarded, separate route tree).
 */
@ApiTags('Customers — Reviews')
@Public()
@Controller('catalog/products/:productId/reviews')
export class CustomerReviewController {
  constructor(
    private readonly submitReview: SubmitReviewUseCase,
    private readonly listProductReviews: ListProductReviewsUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Approved reviews plus the average rating and count.' })
  async list(@Param('productId') productId: string) {
    const result = await this.listProductReviews.execute({ productId });
    return {
      summary: result.summary,
      reviews: result.reviews.map((review) => ReviewResponseDto.fromDomain(review)),
    };
  }

  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth('customer-access-token')
  @Post()
  @ApiCreatedResponse({ type: ReviewResponseDto })
  async submit(
    @Param('productId') productId: string,
    @Body() dto: SubmitReviewDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<ReviewResponseDto> {
    const review = await this.submitReview.execute({
      customerId: requireCustomerId(actor),
      productId,
      rating: dto.rating,
      body: dto.body,
    });
    return ReviewResponseDto.fromDomain(review);
  }
}
