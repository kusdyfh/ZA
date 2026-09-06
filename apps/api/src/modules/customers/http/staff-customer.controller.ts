import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';
import { GetCustomerUseCase } from '../application/use-cases/get-customer.use-case';
import { ListCustomerOrdersUseCase } from '../application/use-cases/list-customer-orders.use-case';
import { CustomerResponseDto } from '../application/dto/customer-response.dto';
import { OrderResponseDto } from '../../orders/application/dto/order-response.dto';

/**
 * Staff support lookup — docs/product/02-CUSTOMERS.md: Manager/Sales/
 * Customer Support may view a customer's profile and order history to
 * help with a phone inquiry. Guarded, reusing `CUSTOMERS_VIEW` (seeded
 * Epic 2, first used here).
 */
@ApiTags('Customers — Staff Lookup')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.CUSTOMERS_VIEW)
@Controller('customers')
export class StaffCustomerController {
  constructor(
    private readonly getCustomer: GetCustomerUseCase,
    private readonly listCustomerOrders: ListCustomerOrdersUseCase,
  ) {}

  @Get(':id')
  @ApiOkResponse({ type: CustomerResponseDto })
  async get(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.getCustomer.execute({ customerId: id });
    return CustomerResponseDto.fromDomain(customer);
  }

  @Get(':id/orders')
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  async listOrders(@Param('id') id: string): Promise<OrderResponseDto[]> {
    const orders = await this.listCustomerOrders.execute({ customerId: id });
    return orders.map((order) => OrderResponseDto.fromDomain(order));
  }
}
