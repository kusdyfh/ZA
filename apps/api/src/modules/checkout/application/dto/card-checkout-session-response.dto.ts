import type { InitiateCardCheckoutResult } from '../use-cases/initiate-card-checkout.use-case';

export class CardCheckoutSessionResponseDto {
  checkoutUrl!: string | null;
  paymentSessionId!: string;

  static fromResult(this: void, result: InitiateCardCheckoutResult): CardCheckoutSessionResponseDto {
    const dto = new CardCheckoutSessionResponseDto();
    dto.checkoutUrl = result.checkoutUrl;
    dto.paymentSessionId = result.paymentSessionId;
    return dto;
  }
}
