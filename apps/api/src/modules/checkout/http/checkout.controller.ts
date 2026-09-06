import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PlaceOrderUseCase } from '../application/use-cases/place-order.use-case';
import { InitiateCardCheckoutUseCase } from '../application/use-cases/initiate-card-checkout.use-case';
import { PlaceOrderDto } from '../application/dto/place-order.dto';
import { InitiateCardCheckoutDto } from '../application/dto/initiate-card-checkout.dto';
import { CardCheckoutSessionResponseDto } from '../application/dto/card-checkout-session-response.dto';
import { OrderResponseDto } from '../../orders/application/dto/order-response.dto';
import { Public } from '../../../shared/decorators/public.decorator';
import type { PaymentMethodValue } from '../../orders/domain/constants/payment-method.constants';

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
  async createCardSession(@Body() dto: InitiateCardCheckoutDto): Promise<CardCheckoutSessionResponseDto> {
    const result = await this.initiateCardCheckout.execute(dto);
    return CardCheckoutSessionResponseDto.fromResult(result);
  }
}
