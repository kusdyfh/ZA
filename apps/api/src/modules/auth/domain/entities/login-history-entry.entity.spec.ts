import { LoginHistoryEntry, type LoginHistoryEntryProps } from './login-history-entry.entity';

function buildEntry(overrides: Partial<LoginHistoryEntryProps> = {}): LoginHistoryEntry {
  const props: LoginHistoryEntryProps = {
    id: 'lh-1',
    adminUserId: 'user-1',
    emailAttempted: 'admin@za-store.local',
    success: true,
    failureReason: null,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    createdAt: new Date(),
    ...overrides,
  };
  return LoginHistoryEntry.reconstitute(props);
}

describe('LoginHistoryEntry', () => {
  it('exposes every field via getters', () => {
    const entry = buildEntry();
    expect(entry.emailAttempted).toBe('admin@za-store.local');
    expect(entry.success).toBe(true);
    expect(entry.adminUserId).toBe('user-1');
  });

  it('supports a failed attempt with no adminUserId', () => {
    const entry = buildEntry({ adminUserId: null, success: false });
    expect(entry.adminUserId).toBeNull();
    expect(entry.success).toBe(false);
  });
});
