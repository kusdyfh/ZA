import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ModerateReviewDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
