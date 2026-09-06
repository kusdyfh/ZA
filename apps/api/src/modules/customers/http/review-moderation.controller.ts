import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { ListPendingReviewsUseCase } from '../application/use-cases/list-pending-reviews.use-case';
import { ModerateReviewUseCase } from '../application/use-cases/moderate-review.use-case';
import { ModerateReviewDto } from '../application/dto/moderate-review.dto';
import { ReviewResponseDto } from '../application/dto/review-response.dto';

/**
 * Staff review moderation — docs/product/13-REVIEWS.md. Guarded, reusing
 * `REVIEWS_MODERATE` (seeded Epic 2, first used here — ADR 0018 §6). A
 * review always resolves one way or the other, never left in limbo.
 */
@ApiTags('Reviews — Moderation')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.REVIEWS_MODERATE)
@Controller('reviews')
export class ReviewModerationController {
  constructor(
    private readonly listPendingReviews: ListPendingReviewsUseCase,
    private readonly moderateReview: ModerateReviewUseCase,
  ) {}

  @Get('pending')
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  async listPending(): Promise<ReviewResponseDto[]> {
    const reviews = await this.listPendingReviews.execute();
    return reviews.map((review) => ReviewResponseDto.fromDomain(review));
  }

  @Post(':id/moderate')
  @ApiOkResponse({ type: ReviewResponseDto })
  async moderate(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<ReviewResponseDto> {
    const review = await this.moderateReview.execute({
      reviewId: id,
      approve: dto.approve,
      rejectionReason: dto.rejectionReason,
      actor,
    });
    return ReviewResponseDto.fromDomain(review);
  }
}
