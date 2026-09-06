import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { GetOrderUseCase } from '../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../application/use-cases/list-orders.use-case';
import { AdvanceOrderStatusUseCase } from '../application/use-cases/advance-order-status.use-case';
import { CancelOrderUseCase } from '../application/use-cases/cancel-order.use-case';
import { AddOrderNoteUseCase } from '../application/use-cases/add-order-note.use-case';
import { ListOrdersQueryDto } from '../application/dto/list-orders-query.dto';
import { AdvanceOrderStatusDto } from '../application/dto/advance-order-status.dto';
import { CancelOrderDto } from '../application/dto/cancel-order.dto';
import { AddOrderNoteDto } from '../application/dto/add-order-note.dto';
import { OrderResponseDto } from '../application/dto/order-response.dto';
import type { OrderStatusValue } from '../domain/constants/order-status.constants';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/**
 * Order lifecycle, timeline, and notes — docs/product/07-ORDERS.md.
 * Guarded, with real per-route permissions (ADR 0017 §7 — replaces
 * ADR 0016 §2's coarse guard). There is no customer-facing "track my
 * order" endpoint yet — guest orders have no session to verify ownership
 * against (see PROJECT_STATUS.md).
 */
@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly getOrder: GetOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly advanceOrderStatus: AdvanceOrderStatusUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly addOrderNote: AddOrderNoteUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_KEYS.ORDERS_VIEW)
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async list(@Query() query: ListOrdersQueryDto): Promise<PaginatedResult<OrderResponseDto>> {
    const orders = await this.listOrders.execute({ status: query.status });
    const dtos = orders.map((order) => OrderResponseDto.fromDomain(order));
    return paginate(dtos, query, {
      searchableFields: ['orderNumber', 'customerNameSnapshot', 'customerEmailSnapshot'],
      sortableFields: ['orderNumber', 'status', 'total', 'createdAt'],
    });
  }

  @Get(':id')
  @RequirePermission(PERMISSION_KEYS.ORDERS_VIEW)
  @ApiOkResponse({ type: OrderResponseDto })
  async get(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.getOrder.execute({ orderId: id });
    return OrderResponseDto.fromDomain(order);
  }

  @Patch(':id/status')
  @RequirePermission(PERMISSION_KEYS.ORDERS_FULFILL)
  @ApiOkResponse({ type: OrderResponseDto })
  async advanceStatus(
    @Param('id') id: string,
    @Body() dto: AdvanceOrderStatusDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<OrderResponseDto> {
    const order = await this.advanceOrderStatus.execute({
      orderId: id,
      status: dto.status as OrderStatusValue,
      note: dto.note,
      actor,
    });
    return OrderResponseDto.fromDomain(order);
  }

  @Post(':id/cancel')
  @RequirePermission(PERMISSION_KEYS.ORDERS_REFUND)
  @ApiOkResponse({ type: OrderResponseDto })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<OrderResponseDto> {
    const order = await this.cancelOrder.execute({ orderId: id, reason: dto.reason, actor });
    return OrderResponseDto.fromDomain(order);
  }

  @Post(':id/notes')
  @RequirePermission(PERMISSION_KEYS.ORDERS_NOTES)
  @ApiOkResponse({ type: OrderResponseDto })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddOrderNoteDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<OrderResponseDto> {
    const order = await this.addOrderNote.execute({
      orderId: id,
      body: dto.body,
      isInternal: dto.isInternal,
      actor,
    });
    return OrderResponseDto.fromDomain(order);
  }
}
