import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PlaceOrderUseCase } from '../application/use-cases/place-order.use-case';
import { InitiateCardCheckoutUseCase } from '../application/use-cases/initiate-card-checkout.use-case';
import { RequestPhoneVerificationUseCase } from '../application/use-cases/request-phone-verification.use-case';
import { ConfirmPhoneVerificationUseCase } from '../application/use-cases/confirm-phone-verification.use-case';
import { PlaceOrderDto } from '../application/dto/place-order.dto';
import { InitiateCardCheckoutDto } from '../application/dto/initiate-card-checkout.dto';
import { CardCheckoutSessionResponseDto } from '../application/dto/card-checkout-session-response.dto';
import { RequestPhoneVerificationDto } from '../application/dto/request-phone-verification.dto';
import { ConfirmPhoneVerificationDto } from '../application/dto/confirm-phone-verification.dto';
import {
  ConfirmPhoneVerificationResponseDto,
  RequestPhoneVerificationResponseDto,
} from '../application/dto/phone-verification-response.dto';
import { OrderResponseDto } from '../../orders/application/dto/order-response.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import type { PaymentMethodValue } from '../../orders/domain/constants/payment-method.constants';
import type { AppConfig } from '../../../shared/config/configuration';

/** One resend per minute per phone (enforced in the use-case too); this caps total requests per IP regardless of phone. */
const PHONE_VERIFICATION_REQUEST_RATE_LIMIT = { limit: 5, ttlMs: 60_000 };
const PHONE_VERIFICATION_CONFIRM_RATE_LIMIT = { limit: 10, ttlMs: 60_000 };

/**
 * The Cart→Order orchestration — docs/product/08-CHECKOUT.md. Fully
 * public, per ADR 0015 ("guest checkout is always available"). A real
 * side-effecting action endpoint (stock reservation, order creation),
 * not plain resource CRUD — per docs/08-API-REVIEW.md §1.
 *
 * `card-sessions` (Epic 12, ADR 0026) is the CARD counterpart to
 * `place-order` — it never creates an `Order` itself; it reserves stock
 * and starts a Stripe Checkout Session, returning a redirect URL. The
 * `Order` is only created later, by the Stripe webhook
 * (`POST /v1/payments/webhooks/stripe`), once payment actually succeeds.
 */
@ApiTags('Checkout')
@Public()
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly placeOrder: PlaceOrderUseCase,
    private readonly initiateCardCheckout: InitiateCardCheckoutUseCase,
    private readonly requestPhoneVerification: RequestPhoneVerificationUseCase,
    private readonly confirmPhoneVerification: ConfirmPhoneVerificationUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('place-order')
  @ApiCreatedResponse({ type: OrderResponseDto })
  async submit(@Body() dto: PlaceOrderDto): Promise<OrderResponseDto> {
    const order = await this.placeOrder.execute({
      ...dto,
      paymentMethod: dto.paymentMethod as PaymentMethodValue,
    });
    return OrderResponseDto.fromDomain(order);
  }

  @Post('card-sessions')
  @ApiCreatedResponse({ type: CardCheckoutSessionResponseDto })
  async createCardSession(
    @Body() dto: InitiateCardCheckoutDto,
  ): Promise<CardCheckoutSessionResponseDto> {
    const result = await this.initiateCardCheckout.execute(dto);
    return CardCheckoutSessionResponseDto.fromResult(result);
  }

  @Throttle({ default: PHONE_VERIFICATION_REQUEST_RATE_LIMIT })
  @Post('phone-verification/request')
  @ApiCreatedResponse({ type: RequestPhoneVerificationResponseDto })
  async requestPhoneVerificationCode(
    @Body() dto: RequestPhoneVerificationDto,
  ): Promise<RequestPhoneVerificationResponseDto> {
    const appConfig = this.configService.getOrThrow<AppConfig>('app');
    const result = await this.requestPhoneVerification.execute({
      phone: dto.phone,
      revealCode: appConfig.nodeEnv !== 'production',
    });
    return RequestPhoneVerificationResponseDto.fromResult(result);
  }

  @Throttle({ default: PHONE_VERIFICATION_CONFIRM_RATE_LIMIT })
  @Post('phone-verification/confirm')
  @ApiCreatedResponse({ type: ConfirmPhoneVerificationResponseDto })
  async confirmPhoneVerificationCode(
    @Body() dto: ConfirmPhoneVerificationDto,
  ): Promise<ConfirmPhoneVerificationResponseDto> {
    const result = await this.confirmPhoneVerification.execute(dto);
    return ConfirmPhoneVerificationResponseDto.fromResult(result);
  }
}
