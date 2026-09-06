import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AddCartItemUseCase } from '../application/use-cases/add-cart-item.use-case';
import { UpdateCartItemQuantityUseCase } from '../application/use-cases/update-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from '../application/use-cases/remove-cart-item.use-case';
import { GetCartUseCase } from '../application/use-cases/get-cart.use-case';
import { AddCartItemDto } from '../application/dto/add-cart-item.dto';
import { UpdateCartItemQuantityDto } from '../application/dto/update-cart-item-quantity.dto';
import { RemoveCartItemDto } from '../application/dto/remove-cart-item.dto';
import { CartResponseDto } from '../application/dto/cart-response.dto';
import { Public } from '../../../shared/decorators/public.decorator';

class GetCartQueryDto {
  @IsString()
  @IsNotEmpty()
  guestToken!: string;
}

/**
 * The guest shopping cart — docs/product/08-CHECKOUT.md. Fully public:
 * per ADR 0015, an account is never required to buy. Identified solely
 * by `guestToken` (no session/cookie middleware exists yet), passed
 * explicitly by the client in every request.
 */
@ApiTags('Checkout — Cart')
@Public()
@Controller('checkout/cart')
export class CartController {
  constructor(
    private readonly addCartItem: AddCartItemUseCase,
    private readonly updateCartItemQuantity: UpdateCartItemQuantityUseCase,
    private readonly removeCartItem: RemoveCartItemUseCase,
    private readonly getCart: GetCartUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'The cart with live-priced items and a subtotal.' })
  async get(@Query() query: GetCartQueryDto) {
    return this.getCart.execute({ guestToken: query.guestToken });
  }

  @Post('items')
  @ApiOkResponse({ type: CartResponseDto })
  async addItem(@Body() dto: AddCartItemDto): Promise<CartResponseDto> {
    const cart = await this.addCartItem.execute(dto);
    return CartResponseDto.fromDomain(cart);
  }

  @Patch('items')
  @ApiOkResponse({ type: CartResponseDto })
  async updateItemQuantity(@Body() dto: UpdateCartItemQuantityDto): Promise<CartResponseDto> {
    const cart = await this.updateCartItemQuantity.execute(dto);
    return CartResponseDto.fromDomain(cart);
  }

  @Delete('items')
  @ApiOkResponse({ type: CartResponseDto })
  async removeItem(@Body() dto: RemoveCartItemDto): Promise<CartResponseDto> {
    const cart = await this.removeCartItem.execute(dto);
    return CartResponseDto.fromDomain(cart);
  }
}
