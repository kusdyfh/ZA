import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { requireCustomerId } from './require-customer-id';
import { CreateAddressUseCase } from '../application/use-cases/create-address.use-case';
import { UpdateAddressUseCase } from '../application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '../application/use-cases/delete-address.use-case';
import { ListAddressesUseCase } from '../application/use-cases/list-addresses.use-case';
import { CreateAddressDto } from '../application/dto/create-address.dto';
import { UpdateAddressDto } from '../application/dto/update-address.dto';
import { AddressResponseDto } from '../application/dto/address-response.dto';

/** A customer's own address book (docs/product/02-CUSTOMERS.md) — self-service only. */
@ApiTags('Customers — Addresses')
@Public()
@UseGuards(CustomerAuthGuard)
@ApiBearerAuth('customer-access-token')
@Controller('customers/me/addresses')
export class CustomerAddressController {
  constructor(
    private readonly createAddress: CreateAddressUseCase,
    private readonly updateAddress: UpdateAddressUseCase,
    private readonly deleteAddress: DeleteAddressUseCase,
    private readonly listAddresses: ListAddressesUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: AddressResponseDto })
  async create(
    @Body() dto: CreateAddressDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<AddressResponseDto> {
    const address = await this.createAddress.execute({ ...dto, customerId: requireCustomerId(actor) });
    return AddressResponseDto.fromDomain(address);
  }

  @Get()
  @ApiOkResponse({ type: AddressResponseDto, isArray: true })
  async list(@CurrentActor() actor: ActorRef): Promise<AddressResponseDto[]> {
    const addresses = await this.listAddresses.execute({ customerId: requireCustomerId(actor) });
    return addresses.map((address) => AddressResponseDto.fromDomain(address));
  }

  @Patch(':id')
  @ApiOkResponse({ type: AddressResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<AddressResponseDto> {
    const address = await this.updateAddress.execute({
      ...dto,
      addressId: id,
      customerId: requireCustomerId(actor),
    });
    return AddressResponseDto.fromDomain(address);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string, @CurrentActor() actor: ActorRef): Promise<void> {
    await this.deleteAddress.execute({ addressId: id, customerId: requireCustomerId(actor) });
  }
}
