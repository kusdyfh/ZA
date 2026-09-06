import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ActorRef } from '@za/types';
import { CurrentActor } from '../../../shared/decorators/current-actor.decorator';
import { ListQueryDto } from '../../../shared/pagination/list-query.dto';
import { paginate, type PaginatedResult } from '../../../shared/pagination/paginate';
import { CreateAdminUserUseCase } from '../application/use-cases/create-admin-user.use-case';
import { ListAdminUsersUseCase } from '../application/use-cases/list-admin-users.use-case';
import { ActivateAdminUserUseCase } from '../application/use-cases/activate-admin-user.use-case';
import { DeactivateAdminUserUseCase } from '../application/use-cases/deactivate-admin-user.use-case';
import { ChangeAdminUserRoleUseCase } from '../application/use-cases/change-admin-user-role.use-case';
import { CreateAdminUserDto } from '../application/dto/create-admin-user.dto';
import { UpdateAdminUserRoleDto } from '../application/dto/update-admin-user-role.dto';
import { AdminUserResponseDto } from '../application/dto/admin-user-response.dto';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../domain/constants/permissions.constants';

/**
 * Staff account management — docs/product/23-ROLES-PERMISSIONS.md.
 * Guarded, requiring `USERS_MANAGE` on every route — no dedicated
 * "view staff list" permission exists in Epic 2's seeded permission set,
 * so listing staff is treated as sensitive as managing them (ADR 0017 §7).
 */
@ApiTags('Identity — Admin Users')
@ApiBearerAuth('access-token')
@RequirePermission(PERMISSION_KEYS.USERS_MANAGE)
@Controller('identity/admin-users')
export class AdminUsersController {
  constructor(
    private readonly createAdminUser: CreateAdminUserUseCase,
    private readonly listAdminUsers: ListAdminUsersUseCase,
    private readonly activateAdminUser: ActivateAdminUserUseCase,
    private readonly deactivateAdminUser: DeactivateAdminUserUseCase,
    private readonly changeAdminUserRole: ChangeAdminUserRoleUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: AdminUserResponseDto })
  async create(
    @Body() dto: CreateAdminUserDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<AdminUserResponseDto> {
    const user = await this.createAdminUser.execute({ ...dto, actor });
    return AdminUserResponseDto.fromDomain(user);
  }

  @Get()
  @ApiOkResponse({ type: AdminUserResponseDto, isArray: true })
  async list(@Query() query: ListQueryDto): Promise<PaginatedResult<AdminUserResponseDto>> {
    const users = await this.listAdminUsers.execute();
    const dtos = users.map((user) => AdminUserResponseDto.fromDomain(user));
    return paginate(dtos, query, {
      searchableFields: ['name', 'email'],
      sortableFields: ['name', 'email', 'createdAt', 'isActive'],
    });
  }

  @Patch(':id/activate')
  @ApiOkResponse({ type: AdminUserResponseDto })
  async activate(
    @Param('id') id: string,
    @CurrentActor() actor: ActorRef,
  ): Promise<AdminUserResponseDto> {
    const user = await this.activateAdminUser.execute({ adminUserId: id, actor });
    return AdminUserResponseDto.fromDomain(user);
  }

  @Patch(':id/deactivate')
  @ApiOkResponse({ type: AdminUserResponseDto })
  async deactivate(
    @Param('id') id: string,
    @CurrentActor() actor: ActorRef,
  ): Promise<AdminUserResponseDto> {
    const user = await this.deactivateAdminUser.execute({ adminUserId: id, actor });
    return AdminUserResponseDto.fromDomain(user);
  }

  @Patch(':id/role')
  @ApiOkResponse({ type: AdminUserResponseDto })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserRoleDto,
    @CurrentActor() actor: ActorRef,
  ): Promise<AdminUserResponseDto> {
    const user = await this.changeAdminUserRole.execute({
      adminUserId: id,
      newRoleId: dto.roleId,
      actor,
    });
    return AdminUserResponseDto.fromDomain(user);
  }
}
