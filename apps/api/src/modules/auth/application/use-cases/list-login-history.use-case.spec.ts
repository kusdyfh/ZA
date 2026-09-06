import { ListLoginHistoryUseCase } from './list-login-history.use-case';
import type { LoginHistoryRepository } from '../../domain/repositories/login-history.repository';
import { LoginHistoryEntry } from '../../domain/entities/login-history-entry.entity';

describe('ListLoginHistoryUseCase', () => {
  let loginHistory: jest.Mocked<LoginHistoryRepository>;
  let useCase: ListLoginHistoryUseCase;

  beforeEach(() => {
    loginHistory = { record: jest.fn(), listByAdminUserId: jest.fn() };
    useCase = new ListLoginHistoryUseCase(loginHistory);
  });

  it("returns the given admin's login history", async () => {
    const entry = LoginHistoryEntry.reconstitute({
      id: 'lh-1',
      adminUserId: 'user-1',
      emailAttempted: 'jane@example.com',
      success: true,
      failureReason: null,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
    });
    loginHistory.listByAdminUserId.mockResolvedValue([entry]);

    const result = await useCase.execute({ adminUserId: 'user-1' });

    expect(result).toEqual([entry]);
    expect(loginHistory.listByAdminUserId).toHaveBeenCalledWith('user-1');
  });
});
