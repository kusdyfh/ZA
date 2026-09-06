import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { CustomerAuthGuard } from '../../../shared/guards/customer-auth.guard';
import { RegisterCustomerUseCase } from '../application/use-cases/register-customer.use-case';
import { CustomerLoginUseCase } from '../application/use-cases/customer-login.use-case';
import { RefreshCustomerTokenUseCase } from '../application/use-cases/refresh-customer-token.use-case';
import { LogoutCustomerUseCase } from '../application/use-cases/logout-customer.use-case';
import { RegisterCustomerDto } from '../application/dto/register-customer.dto';
import { CustomerLoginDto } from '../application/dto/customer-login.dto';
import { CustomerRefreshTokenDto } from '../application/dto/customer-refresh-token.dto';
import { CustomerAuthTokensResponseDto } from '../application/dto/customer-auth-tokens-response.dto';

/**
 * Customer registration/login — ADR 0018 §2. Fully `@Public()`; `logout`
 * additionally requires a valid customer access token (it's the caller's
 * own session being revoked).
 */
@ApiTags('Customers — Auth')
@Public()
@Controller('customers/auth')
export class CustomerAuthController {
  constructor(
    private readonly registerCustomer: RegisterCustomerUseCase,
    private readonly customerLogin: CustomerLoginUseCase,
    private readonly refreshCustomerToken: RefreshCustomerTokenUseCase,
    private readonly logoutCustomer: LogoutCustomerUseCase,
  ) {}

  @Post('register')
  @ApiCreatedResponse({ type: CustomerAuthTokensResponseDto })
  async register(@Body() dto: RegisterCustomerDto): Promise<CustomerAuthTokensResponseDto> {
    const result = await this.registerCustomer.execute(dto);
    return CustomerAuthTokensResponseDto.fromTokens(
      result.accessToken,
      result.refreshToken,
      result.customer,
    );
  }

  @Post('login')
  @ApiCreatedResponse({ type: CustomerAuthTokensResponseDto })
  async login(@Body() dto: CustomerLoginDto): Promise<CustomerAuthTokensResponseDto> {
    const result = await this.customerLogin.execute(dto);
    return CustomerAuthTokensResponseDto.fromTokens(
      result.accessToken,
      result.refreshToken,
      result.customer,
    );
  }

  @Post('refresh')
  @ApiCreatedResponse({ type: CustomerAuthTokensResponseDto })
  async refresh(@Body() dto: CustomerRefreshTokenDto): Promise<CustomerAuthTokensResponseDto> {
    const result = await this.refreshCustomerToken.execute({ refreshToken: dto.refreshToken });
    return CustomerAuthTokensResponseDto.fromTokens(result.accessToken, result.refreshToken);
  }

  @ApiBearerAuth('customer-access-token')
  @UseGuards(CustomerAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: CustomerRefreshTokenDto): Promise<void> {
    await this.logoutCustomer.execute({ refreshToken: dto.refreshToken });
  }
}
