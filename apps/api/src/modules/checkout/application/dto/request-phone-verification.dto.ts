import { IsNotEmpty, IsString } from 'class-validator';

export class RequestPhoneVerificationDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
