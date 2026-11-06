import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { StoreContext } from '../../../../infrastructure/store/store-context.service';
import { PhoneVerificationCode } from '../../domain/entities/phone-verification-code.entity';
import type {
  CreatePhoneVerificationCodeData,
  PhoneVerificationCodeRepository,
} from '../../domain/repositories/phone-verification-code.repository';
import { PhoneVerificationCodeMapper } from '../mappers/phone-verification-code.mapper';

@Injectable()
export class PrismaPhoneVerificationCodeRepository implements PhoneVerificationCodeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeContext: StoreContext,
  ) {}

  async create(
    data: CreatePhoneVerificationCodeData,
  ): Promise<PhoneVerificationCode> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const record = await this.prisma.phoneVerificationCode.create({
      data: {
        storeId,
        phone: data.phone,
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
      },
    });
    return PhoneVerificationCodeMapper.toDomain(record);
  }

  async findLatestByPhone(
    phone: string,
  ): Promise<PhoneVerificationCode | null> {
    const storeId = await this.storeContext.getCurrentStoreId();
    const record = await this.prisma.phoneVerificationCode.findFirst({
      where: { storeId, phone },
      orderBy: { createdAt: 'desc' },
    });
    return record ? PhoneVerificationCodeMapper.toDomain(record) : null;
  }

  async save(code: PhoneVerificationCode): Promise<void> {
    const props = code.toProps();
    await this.prisma.phoneVerificationCode.update({
      where: { id: props.id },
      data: {
        attempts: props.attempts,
        verifiedAt: props.verifiedAt,
        consumedAt: props.consumedAt,
      },
    });
  }
}
