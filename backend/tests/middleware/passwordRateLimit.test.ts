import { Request } from 'express';
import { passwordAccountKey } from '../../src/middleware/passwordRateLimit';

describe('password attempt account limiting', () => {
  test('groups attempts for the same account across IP addresses', () => {
    const firstRequest = {
      user: { userId: 42, role: 'CLIENT' },
      ip: '192.0.2.10',
    } as Request;
    const secondRequest = {
      user: { userId: 42, role: 'CLIENT' },
      ip: '192.0.2.11',
    } as Request;

    expect(passwordAccountKey(firstRequest)).toBe('account:42');
    expect(passwordAccountKey(secondRequest)).toBe('account:42');
  });

  test('keeps different accounts in separate buckets', () => {
    const first = { user: { userId: 42, role: 'CLIENT' } } as Request;
    const second = { user: { userId: 43, role: 'CLIENT' } } as Request;

    expect(passwordAccountKey(first)).not.toBe(passwordAccountKey(second));
  });
});
