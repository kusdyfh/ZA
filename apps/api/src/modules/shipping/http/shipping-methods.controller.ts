import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { CreateShippingMethodUseCase } from '../application/use-cases/create-shipping-method.use-case';
import { UpdateShippingMethodUseCase } from '../application/use-cases/update-shipping-method.use-case';
import { ListShippingMethodsUseCase } from '../application/use-cases/list-shipping-methods.use-case';
import { CreateShippingMethodDto } from '../application/dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from '../application/dto/update-shipping-method.dto';
import { ShippingMethodResponseDto } from '../application/dto/shipping-method-response.dto';

@ApiTags('Shipping — Methods')
@ApiBearerAuth('access-token')
@Controller('shipping/methods')
export class ShippingMethodsController {
  constructor(
    private readonly createShippingMethod: CreateShippingMethodUseCase,
    private readonly updateShippingMethod: UpdateShippingMethodUseCase,
    private readonly listShippingMethods: ListShippingMethodsUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiOkResponse({ type: ShippingMethodResponseDto, isArray: true })
  async list(): Promise<ShippingMethodResponseDto[]> {
    const methods = await this.listShippingMethods.execute();
    return methods.map(ShippingMethodResponseDto.fromDomain);
  }

  @Post()
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiCreatedResponse({ type: ShippingMethodResponseDto })
  async create(@Body() dto: CreateShippingMethodDto): Promise<ShippingMethodResponseDto> {
    const method = await this.createShippingMethod.execute(dto);
    return ShippingMethodResponseDto.fromDomain(method);
  }

  @Patch(':id')
  @RequirePermission(PERMISSION_KEYS.SETTINGS_MANAGE)
  @ApiOkResponse({ type: ShippingMethodResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateShippingMethodDto): Promise<ShippingMethodResponseDto> {
    const method = await this.updateShippingMethod.execute({ methodId: id, ...dto });
    return ShippingMethodResponseDto.fromDomain(method);
  }
}
