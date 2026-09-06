import type { CartItem } from '../../domain/entities/cart-item.entity';

export class CartItemResponseDto {
  id!: string;
  variantId!: string;
  quantity!: number;

  static fromDomain(item: CartItem): CartItemResponseDto {
    const dto = new CartItemResponseDto();
    dto.id = item.id;
    dto.variantId = item.variantId;
    dto.quantity = item.quantity;
    return dto;
  }
}
