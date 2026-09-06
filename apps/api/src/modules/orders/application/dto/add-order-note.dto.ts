import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddOrderNoteDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}
