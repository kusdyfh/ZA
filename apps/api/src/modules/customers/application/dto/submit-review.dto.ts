import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CustomerPolicy } from '../../domain/policies/customer-policy';

export class SubmitReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(CustomerPolicy.REVIEW_BODY_MAX_LENGTH)
  body?: string;
}
