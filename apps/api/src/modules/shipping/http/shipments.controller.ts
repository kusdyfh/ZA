import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { DispatchShipmentUseCase } from '../application/use-cases/dispatch-shipment.use-case';
import { MarkShipmentDeliveredUseCase } from '../application/use-cases/mark-shipment-delivered.use-case';
import { GetShipmentUseCase } from '../application/use-cases/get-shipment.use-case';
import { ListShipmentsUseCase } from '../application/use-cases/list-shipments.use-case';
import { TrackShipmentUseCase } from '../application/use-cases/track-shipment.use-case';
import { DispatchShipmentDto } from '../application/dto/dispatch-shipment.dto';
import { TrackShipmentQueryDto } from '../application/dto/track-shipment-query.dto';
import { ShipmentResponseDto } from '../application/dto/shipment-response.dto';

/**
 * Shipment management (ADR 0027) — admin routes reuse the already-seeded
 * `orders.view`/`orders.fulfill` permissions (shipment progression *is*
 * order fulfillment). `track` is `@Public()` — guest-friendly, per
 * `TrackShipmentUseCase`'s doc comment.
 */
@ApiTags('Shipping — Shipments')
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly dispatchShipment: DispatchShipmentUseCase,
    private readonly markShipmentDelivered: MarkShipmentDeliveredUseCase,
    private readonly getShipment: GetShipmentUseCase,
    private readonly listShipments: ListShipmentsUseCase,
    private readonly trackShipment: TrackShipmentUseCase,
  ) {}

  @Get()
  @ApiBearerAuth('access-token')
  @RequirePermission(PERMISSION_KEYS.ORDERS_VIEW)
  @ApiOkResponse({ type: ShipmentResponseDto, isArray: true })
  async list(): Promise<ShipmentResponseDto[]> {
    const shipments = await this.listShipments.execute();
    return shipments.map(ShipmentResponseDto.fromDomain);
  }

  @Get('track')
  @Public()
  @ApiOkResponse({ type: ShipmentResponseDto })
  async track(@Query() query: TrackShipmentQueryDto): Promise<ShipmentResponseDto> {
    const shipment = await this.trackShipment.execute(query);
    return ShipmentResponseDto.fromDomain(shipment);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @RequirePermission(PERMISSION_KEYS.ORDERS_VIEW)
  @ApiOkResponse({ type: ShipmentResponseDto })
  async get(@Param('id') id: string): Promise<ShipmentResponseDto> {
    const shipment = await this.getShipment.execute(id);
    return ShipmentResponseDto.fromDomain(shipment);
  }

  @Post(':id/dispatch')
  @ApiBearerAuth('access-token')
  @RequirePermission(PERMISSION_KEYS.ORDERS_FULFILL)
  @ApiCreatedResponse({ type: ShipmentResponseDto })
  async dispatch(
    @Param('id') id: string,
    @Body() dto: DispatchShipmentDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.dispatchShipment.execute({ shipmentId: id, ...dto, actor });
    return ShipmentResponseDto.fromDomain(shipment);
  }

  @Post(':id/deliver')
  @ApiBearerAuth('access-token')
  @RequirePermission(PERMISSION_KEYS.ORDERS_FULFILL)
  @ApiCreatedResponse({ type: ShipmentResponseDto })
  async deliver(@Param('id') id: string, @CurrentActor() actor: ActorRef): Promise<ShipmentResponseDto> {
    const shipment = await this.markShipmentDelivered.execute({ shipmentId: id, actor });
    return ShipmentResponseDto.fromDomain(shipment);
  }
}
