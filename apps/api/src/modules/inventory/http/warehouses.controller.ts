import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateWarehouseUseCase } from '../application/use-cases/create-warehouse.use-case';
import { UpdateWarehouseUseCase } from '../application/use-cases/update-warehouse.use-case';
import { ListWarehousesUseCase } from '../application/use-cases/list-warehouses.use-case';
import { CreateWarehouseDto } from '../application/dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../application/dto/update-warehouse.dto';
import { WarehouseResponseDto } from '../application/dto/warehouse-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

/** Warehouse management — docs/product/06-INVENTORY.md. Guarded (Warehouse/Manager/Super Admin). */
@ApiTags('Inventory — Warehouses')
@ApiBearerAuth('access-token')
@Controller('inventory/warehouses')
export class WarehousesController {
  constructor(
    private readonly createWarehouse: CreateWarehouseUseCase,
    private readonly updateWarehouse: UpdateWarehouseUseCase,
    private readonly listWarehouses: ListWarehousesUseCase,
  ) {}

  @Post()
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiCreatedResponse({ type: WarehouseResponseDto })
  async create(@Body() dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = await this.createWarehouse.execute(dto);
    return WarehouseResponseDto.fromDomain(warehouse);
  }

  @Get()
  @RequirePermission(PERMISSION_KEYS.INVENTORY_VIEW)
  @ApiOkResponse({ type: WarehouseResponseDto, isArray: true })
  async list(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.listWarehouses.execute();
    return warehouses.map((warehouse) => WarehouseResponseDto.fromDomain(warehouse));
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.INVENTORY_ADJUST)
  @ApiOkResponse({ type: WarehouseResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = await this.updateWarehouse.execute({ warehouseId: id, ...dto });
    return WarehouseResponseDto.fromDomain(warehouse);
  }
}
