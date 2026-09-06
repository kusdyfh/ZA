import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { STOCK_ADJUSTMENT_REASON, type StockAdjustmentReasonValue } from '../../domain/constants/stock-adjustment-reason.constants';

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  /** Signed — positive increases stock, negative decreases it. Never zero. */
  @IsInt()
  quantity!: number;

  @IsIn(Object.values(STOCK_ADJUSTMENT_REASON))
  reason!: StockAdjustmentReasonValue;

  @IsString()
  @IsOptional()
  note?: string;
}
