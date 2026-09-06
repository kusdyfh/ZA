import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CreateStockReservationUseCase } from '../application/use-cases/create-stock-reservation.use-case';
import { GetStockReservationUseCase } from '../application/use-cases/get-stock-reservation.use-case';
import { ConfirmStockReservationUseCase } from '../application/use-cases/confirm-stock-reservation.use-case';
import { ReleaseStockReservationUseCase } from '../application/use-cases/release-stock-reservation.use-case';
import { ExpireStockReservationsUseCase } from '../application/use-cases/expire-stock-reservations.use-case';
import { CreateStockReservationDto } from '../application/dto/create-stock-reservation.dto';
import { StockReservationResponseDto } from '../application/dto/stock-reservation-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/**
 * Stock holds per ADR 0001 — normally created/confirmed/released by
 * Checkout's own saga (Epic 5), exposed here too for support/admin
 * tooling. Guarded.
 */
@ApiTags('Inventory — Stock Reservations')
@ApiBearerAuth('access-token')
@Controller('inventory/stock-reservations')
export class StockReservationsController {
  constructor(
    private readonly createStockReservation: CreateStockReservationUseCase,
    private readonly getStockReservation: GetStockReservationUseCase,
    private readonly confirmStockReservation: ConfirmStockReservationUseCase,
    private readonly releaseStockReservation: ReleaseStockReservationUseCase,
    private readonly expireStockReservations: ExpireStockReservationsUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiCreatedResponse({ type: StockReservationResponseDto })
  async create(@Body() dto: CreateStockReservationDto): Promise<StockReservationResponseDto> {
    const reservation = await this.createStockReservation.execute(dto);
    return StockReservationResponseDto.fromDomain(reservation);
  }

  @Get(':id')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_VIEW)
  @ApiOkResponse({ type: StockReservationResponseDto })
  async get(@Param('id') id: string): Promise<StockReservationResponseDto> {
    const reservation = await this.getStockReservation.execute({ reservationId: id });
    return StockReservationResponseDto.fromDomain(reservation);
  }

  @Post(':id/confirm')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ type: StockReservationResponseDto })
  async confirm(
    @Param('id') id: string,
    @CurrentActor() actor: ActorRef,
  ): Promise<StockReservationResponseDto> {
    const reservation = await this.confirmStockReservation.execute({ reservationId: id, actor });
    return StockReservationResponseDto.fromDomain(reservation);
  }

  @Post(':id/release')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ type: StockReservationResponseDto })
  async release(@Param('id') id: string): Promise<StockReservationResponseDto> {
    const reservation = await this.releaseStockReservation.execute({ reservationId: id });
    return StockReservationResponseDto.fromDomain(reservation);
  }

  @Post('expire-due')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ description: 'Bulk-expires every ACTIVE reservation past its expiresAt.' })
  async expireDue(): Promise<{ expiredCount: number }> {
    const expiredCount = await this.expireStockReservations.execute();
    return { expiredCount };
  }
}
