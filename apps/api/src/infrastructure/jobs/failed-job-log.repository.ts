import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateFailedJobLogData {
  queueName: string;
  jobName: string;
  payload: unknown;
  error: string;
  failedAt: Date;
}

/** ADR 0003 §"Dead Letter Queue" — a durable archive outside Redis for a job that exhausted its retry budget. */
@Injectable()
export class FailedJobLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFailedJobLogData): Promise<void> {
    await this.prisma.failedJobLog.create({
      data: {
        queueName: data.queueName,
        jobName: data.jobName,
        payload: data.payload as object,
        error: data.error,
        failedAt: data.failedAt,
      },
    });
  }
}
