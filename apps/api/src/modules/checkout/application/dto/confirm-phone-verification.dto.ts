import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPhoneVerificationDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}
