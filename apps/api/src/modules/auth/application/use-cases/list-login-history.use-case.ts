import { Inject, Injectable } from '@nestjs/common';
import type { LoginHistoryEntry } from '../../domain/entities/login-history-entry.entity';
import {
  LOGIN_HISTORY_REPOSITORY,
  type LoginHistoryRepository,
} from '../../domain/repositories/login-history.repository';

export interface ListLoginHistoryInput {
  adminUserId: string;
}

/** Self-service — an admin views only their own login history. */
@Injectable()
export class ListLoginHistoryUseCase {
  constructor(
    @Inject(LOGIN_HISTORY_REPOSITORY) private readonly loginHistory: LoginHistoryRepository,
  ) {}

  async execute(input: ListLoginHistoryInput): Promise<LoginHistoryEntry[]> {
    return this.loginHistory.listByAdminUserId(input.adminUserId);
  }
}
