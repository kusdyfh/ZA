import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { QuoteShippingRateUseCase } from '../application/use-cases/quote-shipping-rate.use-case';
import { ListShippingMethodsUseCase } from '../application/use-cases/list-shipping-methods.use-case';
import { QuoteShippingRateQueryDto } from '../application/dto/quote-shipping-rate-query.dto';
import { QuoteShippingRateResponseDto } from '../application/dto/quote-shipping-rate-response.dto';
import { ShippingMethodResponseDto } from '../application/dto/shipping-method-response.dto';

/**
 * Public storefront reads (ADR 0027) — mirrors the `catalog/storefront`
 * naming convention (ADR 0021). Checkout calls `quote` before submitting
 * an order, both to display the fee and to enforce "checkout blocks
 * addresses outside supported delivery regions... before proceeding"
 * (docs/product/11-SHIPPING.md).
 */
@ApiTags('Storefront — Shipping')
@Public()
@Controller('storefront/shipping')
export class StorefrontShippingController {
  constructor(
    private readonly quoteShippingRate: QuoteShippingRateUseCase,
    private readonly listShippingMethods: ListShippingMethodsUseCase,
  ) {}

  @Get('methods')
  @ApiOkResponse({ type: ShippingMethodResponseDto, isArray: true })
  async methods(): Promise<ShippingMethodResponseDto[]> {
    const methods = await this.listShippingMethods.execute();
    return methods.filter((method) => method.isActive).map(ShippingMethodResponseDto.fromDomain);
  }

  @Get('quote')
  @ApiOkResponse({ type: QuoteShippingRateResponseDto })
  async quote(@Query() query: QuoteShippingRateQueryDto): Promise<QuoteShippingRateResponseDto> {
    const result = await this.quoteShippingRate.execute({
      governorate: query.governorate,
      methodId: query.methodId,
      subtotal: query.subtotal,
      discountTotal: query.discountTotal ?? 0,
    });
    return QuoteShippingRateResponseDto.fromResult(result);
  }
}
