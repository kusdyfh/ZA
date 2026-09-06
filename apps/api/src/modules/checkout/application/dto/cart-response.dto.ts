import type { Cart } from '../../domain/entities/cart.entity';
import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  id!: string;
  guestToken!: string;
  items!: CartItemResponseDto[];

  static fromDomain(cart: Cart): CartResponseDto {
    const dto = new CartResponseDto();
    dto.id = cart.id;
    dto.guestToken = cart.guestToken;
    dto.items = cart.items.map((item) => CartItemResponseDto.fromDomain(item));
    return dto;
  }
}
