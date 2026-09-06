import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { requireCustomerId } from './require-customer-id';
import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { UpdateCustomerProfileUseCase } from '../application/use-cases/update-customer-profile.use-case';
import { ChangeCustomerPasswordUseCase } from '../application/use-cases/change-customer-password.use-case';
import { UpdateCustomerProfileDto } from '../application/dto/update-customer-profile.dto';
import { ChangeCustomerPasswordDto } from '../application/dto/change-customer-password.dto';
import { CustomerResponseDto } from '../application/dto/customer-response.dto';

/** Self-service only (docs/product/02-CUSTOMERS.md) — every route requires a logged-in customer. */
@ApiTags('Customers — Profile')
@Public()
@UseGuards(CustomerAuthGuard)
@ApiBearerAuth('customer-access-token')
@Controller('customers/me')
export class CustomerProfileController {
  constructor(
    private readonly getCustomer: GetCustomerUseCase,
    private readonly updateCustomerProfile: UpdateCustomerProfileUseCase,
    private readonly changeCustomerPassword: ChangeCustomerPasswordUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: CustomerResponseDto })
  async getProfile(@CurrentActor() actor: ActorRef): Promise<CustomerResponseDto> {
    const customer = await this.getCustomer.execute({ customerId: requireCustomerId(actor) });
    return CustomerResponseDto.fromDomain(customer);
  }

  @Patch()
  @ApiOkResponse({ type: CustomerResponseDto })
  async updateProfile(
    @Body() dto: UpdateCustomerProfileDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<CustomerResponseDto> {
    const customer = await this.updateCustomerProfile.execute({
      customerId: requireCustomerId(actor),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      marketingOptIn: dto.marketingOptIn,
    });
    return CustomerResponseDto.fromDomain(customer);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body() dto: ChangeCustomerPasswordDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<void> {
    await this.changeCustomerPassword.execute({
      customerId: requireCustomerId(actor),
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }
}
