import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { RETURN_DISPOSITION, type ReturnDispositionValue } from '../../domain/constants/return-disposition.constants';

export class ProcessReturnDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsIn(Object.values(RETURN_DISPOSITION))
  disposition!: ReturnDispositionValue;

  @IsString()
  @IsOptional()
  note?: string;
}
