import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class TrackShipmentQueryDto {
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @IsEmail()
  email!: string;
}
