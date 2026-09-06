import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAdminUserRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId!: string;
}
