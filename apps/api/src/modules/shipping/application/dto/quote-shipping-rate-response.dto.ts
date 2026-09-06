import type { QuoteShippingRateResult } from '../use-cases/quote-shipping-rate.use-case';

export class QuoteShippingRateResponseDto {
  fee!: number;
  estimatedDays!: { min: number; max: number } | null;

  static fromResult(this: void, result: QuoteShippingRateResult): QuoteShippingRateResponseDto {
    const dto = new QuoteShippingRateResponseDto();
    dto.fee = result.fee;
    dto.estimatedDays = result.estimatedDays;
    return dto;
  }
}
