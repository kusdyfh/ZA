import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { CreateShippingZoneUseCase } from '../application/use-cases/create-shipping-zone.use-case';
import { UpdateShippingZoneUseCase } from '../application/use-cases/update-shipping-zone.use-case';
import { ListShippingZonesUseCase } from '../application/use-cases/list-shipping-zones.use-case';
import { CreateShippingZoneDto } from '../application/dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from '../application/dto/update-shipping-zone.dto';
import { ShippingZoneResponseDto } from '../application/dto/shipping-zone-response.dto';

/**
 * Admin-configured delivery regions (ADR 0027) — reuses the already-seeded
 * `settings.manage` permission (store-wide config), the same reasoning
 * Epic 11 used for staff notification preferences.
 */
@ApiTags('Shipping — Zones')
@ApiBearerAuth('access-token')
@Controller('shipping/zones')
export class ShippingZonesController {
  constructor(
    private readonly createShippingZone: CreateShippingZoneUseCase,
    private readonly updateShippingZone: UpdateShippingZoneUseCase,
    private readonly listShippingZones: ListShippingZonesUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiOkResponse({ type: ShippingZoneResponseDto, isArray: true })
  async list(): Promise<ShippingZoneResponseDto[]> {
    const zones = await this.listShippingZones.execute();
    return zones.map(ShippingZoneResponseDto.fromDomain);
  }

  @Post()
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiCreatedResponse({ type: ShippingZoneResponseDto })
  async create(@Body() dto: CreateShippingZoneDto): Promise<ShippingZoneResponseDto> {
    const zone = await this.createShippingZone.execute(dto);
    return ShippingZoneResponseDto.fromDomain(zone);
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiOkResponse({ type: ShippingZoneResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto): Promise<ShippingZoneResponseDto> {
    const zone = await this.updateShippingZone.execute({ zoneId: id, ...dto });
    return ShippingZoneResponseDto.fromDomain(zone);
  }
}
