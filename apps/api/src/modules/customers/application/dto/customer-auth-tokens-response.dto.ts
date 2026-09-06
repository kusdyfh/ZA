import type { Customer } from '../../domain/entities/customer.entity';
import { CustomerPolicy } from '../../domain/policies/customer-policy';
import { CustomerResponseDto } from './customer-response.dto';

/** Shape returned by both /customers/auth/register|login and /customers/auth/refresh. */
export class CustomerAuthTokensResponseDto {
  accessToken!: string;
  refreshToken!: string;
  tokenType!: 'Bearer';
  expiresIn!: number;
  customer?: CustomerResponseDto;

  static fromTokens(
    accessToken: string,
    refreshToken: string,
    customer?: Customer,
  ): CustomerAuthTokensResponseDto {
    const dto = new CustomerAuthTokensResponseDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.tokenType = 'Bearer';
    dto.expiresIn = CustomerPolicy.ACCESS_TOKEN_TTL_SECONDS;
    dto.customer = customer ? CustomerResponseDto.fromDomain(customer) : undefined;
    return dto;
  }
}
