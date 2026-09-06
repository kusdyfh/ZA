import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { GetOrderPaymentSummaryUseCase } from '../application/use-cases/get-order-payment-summary.use-case';
import { VerifyManualPaymentUseCase } from '../application/use-cases/verify-manual-payment.use-case';
import { IssueRefundUseCase } from '../application/use-cases/issue-refund.use-case';
import { IssueRefundDto } from '../application/dto/issue-refund.dto';
import { OrderPaymentSummaryResponseDto } from '../application/dto/order-payment-summary-response.dto';
import { RefundResponseDto } from '../application/dto/refund-response.dto';
import { OrderResponseDto } from '../../orders/application/dto/order-response.dto';

/**
 * Admin Payment management (ADR 0026) — reuses the already-seeded
 * `orders.view`/`orders.refund` permissions rather than adding new ones
 * (see the ADR's "Approval gating" section).
 */
@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly getOrderPaymentSummary: GetOrderPaymentSummaryUseCase,
    private readonly verifyManualPayment: VerifyManualPaymentUseCase,
    private readonly issueRefund: IssueRefundUseCase,
  ) {}

  @Get('orders/:orderId')
  @RequirePermission(PERMISSION_KEYS.ORDERS_VIEW)
  @ApiOkResponse({ type: OrderPaymentSummaryResponseDto })
  async getOrderSummary(@Param('orderId') orderId: string): Promise<OrderPaymentSummaryResponseDto> {
    const summary = await this.getOrderPaymentSummary.execute(orderId);
    return OrderPaymentSummaryResponseDto.fromDomain(summary);
  }

  @Post('orders/:orderId/verify-manual')
  @RequirePermission(PERMISSION_KEYS.ORDERS_REFUND)
  @ApiCreatedResponse({ type: OrderResponseDto })
  async verifyManual(@Param('orderId') orderId: string, @CurrentActor() actor: ActorRef): Promise<OrderResponseDto> {
    const order = await this.verifyManualPayment.execute({ orderId, actor });
    return OrderResponseDto.fromDomain(order);
  }

  @Post('refunds')
  @RequirePermission(PERMISSION_KEYS.ORDERS_REFUND)
  @ApiCreatedResponse({ type: RefundResponseDto })
  async refund(@Body() dto: IssueRefundDto, @CurrentActor() actor: ActorRef): Promise<RefundResponseDto> {
    const refund = await this.issueRefund.execute({ ...dto, actor });
    return RefundResponseDto.fromDomain(refund);
  }
}
