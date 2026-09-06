import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CatalogModule } from '../catalog/catalog.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { OrdersModule } from '../orders/orders.module';
import { Argon2PasswordHasher } from '../identity/infrastructure/hashing/argon2-password-hasher';

import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository';
import { CUSTOMER_ADDRESS_REPOSITORY } from './domain/repositories/customer-address.repository';
import { WISHLIST_ITEM_REPOSITORY } from './domain/repositories/wishlist-item.repository';
import { REVIEW_REPOSITORY } from './domain/repositories/review.repository';
import { CUSTOMER_REFRESH_TOKEN_REPOSITORY } from './domain/repositories/customer-refresh-token.repository';
import { CUSTOMER_PASSWORD_HASHER } from './domain/services/password-hasher';
import { CUSTOMER_TOKEN_SERVICE } from './domain/services/customer-token.service';

import { PrismaCustomerRepository } from './infrastructure/repositories/prisma-customer.repository';
import { PrismaCustomerAddressRepository } from './infrastructure/repositories/prisma-customer-address.repository';
import { PrismaWishlistItemRepository } from './infrastructure/repositories/prisma-wishlist-item.repository';
import { PrismaReviewRepository } from './infrastructure/repositories/prisma-review.repository';
import { PrismaCustomerRefreshTokenRepository } from './infrastructure/repositories/prisma-customer-refresh-token.repository';
import { CustomerJwtTokenService } from './infrastructure/tokens/customer-jwt-token.service';

import { RegisterCustomerUseCase } from './application/use-cases/register-customer.use-case';
import { CustomerLoginUseCase } from './application/use-cases/customer-login.use-case';
import { RefreshCustomerTokenUseCase } from './application/use-cases/refresh-customer-token.use-case';
import { LogoutCustomerUseCase } from './application/use-cases/logout-customer.use-case';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case';
import { UpdateCustomerProfileUseCase } from './application/use-cases/update-customer-profile.use-case';
import { ChangeCustomerPasswordUseCase } from './application/use-cases/change-customer-password.use-case';
import { CreateAddressUseCase } from './application/use-cases/create-address.use-case';
import { UpdateAddressUseCase } from './application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from './application/use-cases/delete-address.use-case';
import { ListAddressesUseCase } from './application/use-cases/list-addresses.use-case';
import { AddWishlistItemUseCase } from './application/use-cases/add-wishlist-item.use-case';
import { RemoveWishlistItemUseCase } from './application/use-cases/remove-wishlist-item.use-case';
import { ListWishlistUseCase } from './application/use-cases/list-wishlist.use-case';
import { SubmitReviewUseCase } from './application/use-cases/submit-review.use-case';
import { ListProductReviewsUseCase } from './application/use-cases/list-product-reviews.use-case';
import { ListPendingReviewsUseCase } from './application/use-cases/list-pending-reviews.use-case';
import { ModerateReviewUseCase } from './application/use-cases/moderate-review.use-case';
import { ListCustomerOrdersUseCase } from './application/use-cases/list-customer-orders.use-case';
import { MergeGuestCartUseCase } from './application/use-cases/merge-guest-cart.use-case';
import { AssociateGuestOrdersUseCase } from './application/use-cases/associate-guest-orders.use-case';

import { CustomerAuthController } from './http/customer-auth.controller';
import { CustomerProfileController } from './http/customer-profile.controller';
import { CustomerAddressController } from './http/customer-address.controller';
import { CustomerWishlistController } from './http/customer-wishlist.controller';
import { CustomerReviewController } from './http/customer-review.controller';
import { ReviewModerationController } from './http/review-moderation.controller';
import { CustomerOrderHistoryController } from './http/customer-order-history.controller';
import { StaffCustomerController } from './http/staff-customer.controller';

/**
 * The Customer bounded context (ADR 0018) — credentials, profile,
 * addresses, wishlist, reviews, order history, and the guest-merge/
 * -association use-cases, all unified per §1. Imports CheckoutModule
 * (for `CART_REPOSITORY`, the guest-cart merge target) and OrdersModule
 * (for `ORDER_REPOSITORY`, order history + the guest-order-association
 * backfill) — the same cross-module dependency shape Checkout itself
 * already established. `JwtModule.register({})` is registered again
 * here (not shared with Auth's) — no default secret, `CustomerJwtTokenService`
 * passes `CUSTOMER_JWT_ACCESS_SECRET`/`CUSTOMER_JWT_REFRESH_SECRET`
 * explicitly on every call (ADR 0018 §2).
 */
@Module({
  imports: [CatalogModule, CheckoutModule, OrdersModule, JwtModule.register({})],
  controllers: [
    CustomerAuthController,
    CustomerProfileController,
    CustomerAddressController,
    CustomerWishlistController,
    CustomerReviewController,
    ReviewModerationController,
    CustomerOrderHistoryController,
    StaffCustomerController,
  ],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    { provide: CUSTOMER_ADDRESS_REPOSITORY, useClass: PrismaCustomerAddressRepository },
    { provide: WISHLIST_ITEM_REPOSITORY, useClass: PrismaWishlistItemRepository },
    { provide: REVIEW_REPOSITORY, useClass: PrismaReviewRepository },
    { provide: CUSTOMER_REFRESH_TOKEN_REPOSITORY, useClass: PrismaCustomerRefreshTokenRepository },
    { provide: CUSTOMER_PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: CUSTOMER_TOKEN_SERVICE, useClass: CustomerJwtTokenService },
    RegisterCustomerUseCase,
    CustomerLoginUseCase,
    RefreshCustomerTokenUseCase,
    LogoutCustomerUseCase,
    GetCustomerUseCase,
    UpdateCustomerProfileUseCase,
    ChangeCustomerPasswordUseCase,
    CreateAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    ListAddressesUseCase,
    AddWishlistItemUseCase,
    RemoveWishlistItemUseCase,
    ListWishlistUseCase,
    SubmitReviewUseCase,
    ListProductReviewsUseCase,
    ListPendingReviewsUseCase,
    ModerateReviewUseCase,
    ListCustomerOrdersUseCase,
    MergeGuestCartUseCase,
    AssociateGuestOrdersUseCase,
  ],
  // CUSTOMER_REPOSITORY/CUSTOMER_TOKEN_SERVICE are exported so the
  // app-wide CustomerAuthGuard (registered locally per-route, not
  // globally — see ADR 0018 §5) can resolve a customer access token to a
  // real Customer, the same additive-export shape as Identity's guard
  // dependencies.
  exports: [CUSTOMER_REPOSITORY, CUSTOMER_TOKEN_SERVICE],
})
export class CustomersModule {}
