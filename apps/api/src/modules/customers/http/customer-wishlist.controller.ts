import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { requireCustomerId } from './require-customer-id';
import { AddWishlistItemUseCase } from '../application/use-cases/add-wishlist-item.use-case';
import { RemoveWishlistItemUseCase } from '../application/use-cases/remove-wishlist-item.use-case';
import { ListWishlistUseCase } from '../application/use-cases/list-wishlist.use-case';

/** Wishlist requires a logged-in account — no guest wishlist (docs/product/14-WISHLIST.md). */
@ApiTags('Customers — Wishlist')
@Public()
@UseGuards(CustomerAuthGuard)
@ApiBearerAuth('customer-access-token')
@Controller('customers/me/wishlist')
export class CustomerWishlistController {
  constructor(
    private readonly addWishlistItem: AddWishlistItemUseCase,
    private readonly removeWishlistItem: RemoveWishlistItemUseCase,
    private readonly listWishlist: ListWishlistUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'Wishlisted products with live availability.' })
  async list(@CurrentActor() actor: ActorRef) {
    return this.listWishlist.execute({ customerId: requireCustomerId(actor) });
  }

  @Post(':productId')
  @ApiCreatedResponse({ description: 'Added to the wishlist.' })
  async add(@Param('productId') productId: string, @CurrentActor() actor: ActorRef) {
    const item = await this.addWishlistItem.execute({
      customerId: requireCustomerId(actor),
      productId,
    });
    return { productId: item.productId, addedAt: item.createdAt };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('productId') productId: string, @CurrentActor() actor: ActorRef): Promise<void> {
    await this.removeWishlistItem.execute({ customerId: requireCustomerId(actor), productId });
  }
}
