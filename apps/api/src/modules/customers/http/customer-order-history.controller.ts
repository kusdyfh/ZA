import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { requireCustomerId } from './require-customer-id';
import { ListCustomerOrdersUseCase } from '../application/use-cases/list-customer-orders.use-case';
import { OrderResponseDto } from '../../orders/application/dto/order-response.dto';

/** A customer's own order history (docs/product/02-CUSTOMERS.md FR-3). */
@ApiTags('Customers — Order History')
@Public()
@UseGuards(CustomerAuthGuard)
@ApiBearerAuth('customer-access-token')
@Controller('customers/me/orders')
export class CustomerOrderHistoryController {
  constructor(private readonly listCustomerOrders: ListCustomerOrdersUseCase) {}

  @Get()
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async list(@CurrentActor() actor: ActorRef): Promise<OrderResponseDto[]> {
    const orders = await this.listCustomerOrders.execute({ customerId: requireCustomerId(actor) });
    return orders.map((order) => OrderResponseDto.fromDomain(order));
  }
}
