import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { ReceiveStockUseCase } from '../application/use-cases/receive-stock.use-case';
import { AdjustStockUseCase } from '../application/use-cases/adjust-stock.use-case';
import { ProcessReturnUseCase } from '../application/use-cases/process-return.use-case';
import { GetVariantStockUseCase } from '../application/use-cases/get-variant-stock.use-case';
import { ListLowStockVariantsUseCase } from '../application/use-cases/list-low-stock-variants.use-case';
import { SetLowStockThresholdUseCase } from '../application/use-cases/set-low-stock-threshold.use-case';
import { ListStockMovementsUseCase } from '../application/use-cases/list-stock-movements.use-case';
import { ReceiveStockDto } from '../application/dto/receive-stock.dto';
import { AdjustStockDto } from '../application/dto/adjust-stock.dto';
import { ProcessReturnDto } from '../application/dto/process-return.dto';
import { SetLowStockThresholdDto } from '../application/dto/set-low-stock-threshold.dto';
import { VariantStockResponseDto } from '../application/dto/variant-stock-response.dto';
import { StockMovementResponseDto } from '../application/dto/stock-movement-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

class WarehouseQueryDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;
}

/**
 * Stock levels, movements, adjustments, receiving, and returns —
 * docs/product/06-INVENTORY.md. Guarded (Warehouse role primarily, per
 * the permission matrix — enforced for real via `@RequirePermission`,
 * per docs/v2/adr/0017 §7).
 */
@ApiTags('Inventory — Stock')
@ApiBearerAuth('access-token')
@Controller('inventory/stock')
export class StockController {
  constructor(
    private readonly receiveStock: ReceiveStockUseCase,
    private readonly adjustStock: AdjustStockUseCase,
    private readonly processReturn: ProcessReturnUseCase,
    private readonly getVariantStock: GetVariantStockUseCase,
    private readonly listLowStockVariants: ListLowStockVariantsUseCase,
    private readonly setLowStockThreshold: SetLowStockThresholdUseCase,
    private readonly listStockMovements: ListStockMovementsUseCase,
  ) {}

  @Post('receive')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ description: 'Stock received; a RECEIVE movement is recorded.' })
  async receive(@Body() dto: ReceiveStockDto, @CurrentActor() actor: ActorRef) {
    const result = await this.receiveStock.execute({ ...dto, actor });
    return {
      variantStock: VariantStockResponseDto.fromDomain(result.variantStock, result.variantStock.quantity, false),
      movement: StockMovementResponseDto.fromDomain(result.movement),
    };
  }

  @Post('adjust')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ description: 'Stock adjusted; an ADJUSTMENT movement is recorded.' })
  async adjust(@Body() dto: AdjustStockDto, @CurrentActor() actor: ActorRef) {
    const result = await this.adjustStock.execute({ ...dto, actor });
    return {
      variantStock: VariantStockResponseDto.fromDomain(result.variantStock, result.variantStock.quantity, false),
      movement: StockMovementResponseDto.fromDomain(result.movement),
      isUnusuallyLarge: result.isUnusuallyLarge,
    };
  }

  @Post('return')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ description: 'Return processed — RESELLABLE restocks, DAMAGED logs a loss.' })
  async processReturnRequest(@Body() dto: ProcessReturnDto, @CurrentActor() actor: ActorRef) {
    const result = await this.processReturn.execute({ ...dto, actor });
    return {
      variantStock: VariantStockResponseDto.fromDomain(result.variantStock, result.variantStock.quantity, false),
      movement: StockMovementResponseDto.fromDomain(result.movement),
    };
  }

  @Get('low-stock')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_VIEW)
  @ApiOkResponse({ type: VariantStockResponseDto, isArray: true })
  async listLowStock(@Query() query: WarehouseQueryDto): Promise<VariantStockResponseDto[]> {
    const entries = await this.listLowStockVariants.execute({ warehouseId: query.warehouseId });
    return entries.map((entry) =>
      VariantStockResponseDto.fromDomain(entry.variantStock, entry.available, true),
    );
  }

  @Get(':variantId')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_VIEW)
  @ApiOkResponse({ description: 'Current stock, available-to-sell, and low-stock status for one variant.' })
  async get(@Param('variantId') variantId: string, @Query() query: WarehouseQueryDto) {
    const view = await this.getVariantStock.execute({ variantId, warehouseId: query.warehouseId });
    return { variantId, ...view };
  }

  @Get(':variantId/movements')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_VIEW)
  @ApiOkResponse({ type: StockMovementResponseDto, isArray: true })
  async listMovements(@Param('variantId') variantId: string): Promise<StockMovementResponseDto[]> {
    const movements = await this.listStockMovements.execute({ variantId });
    return movements.map((movement) => StockMovementResponseDto.fromDomain(movement));
  }

  @Put(':variantId/threshold')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ description: 'Low-stock threshold updated.' })
  async setThreshold(@Param('variantId') variantId: string, @Body() dto: SetLowStockThresholdDto) {
    const stock = await this.setLowStockThreshold.execute({
      variantId,
      warehouseId: dto.warehouseId,
      threshold: dto.threshold ?? null,
    });
    return VariantStockResponseDto.fromDomain(stock, stock.quantity, false);
  }
}
