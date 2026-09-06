import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { SetShippingRateUseCase } from '../application/use-cases/set-shipping-rate.use-case';
import { ListShippingRatesUseCase } from '../application/use-cases/list-shipping-rates.use-case';
import { SetShippingRateDto } from '../application/dto/set-shipping-rate.dto';
import { ShippingRateResponseDto } from '../application/dto/shipping-rate-response.dto';

@ApiTags('Shipping — Rates')
@ApiBearerAuth('access-token')
@Controller('shipping/rates')
export class ShippingRatesController {
  constructor(
    private readonly setShippingRate: SetShippingRateUseCase,
    private readonly listShippingRates: ListShippingRatesUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiOkResponse({ type: ShippingRateResponseDto, isArray: true })
  async list(): Promise<ShippingRateResponseDto[]> {
    const rates = await this.listShippingRates.execute();
    return rates.map(ShippingRateResponseDto.fromDomain);
  }

  @Post()
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiCreatedResponse({ type: ShippingRateResponseDto })
  async set(@Body() dto: SetShippingRateDto): Promise<ShippingRateResponseDto> {
    const rate = await this.setShippingRate.execute(dto);
    return ShippingRateResponseDto.fromDomain(rate);
  }
}
