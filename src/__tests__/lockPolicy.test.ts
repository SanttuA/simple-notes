import { shouldLockOnForeground } from '@/lock/lockPolicy';

describe('lock policy', () => {
  it('does not lock when biometric lock is disabled', () => {
    expect(shouldLockOnForeground(false, 1000, 30, 60000)).toBe(false);
  });

  it('does not lock before the timeout expires', () => {
    expect(shouldLockOnForeground(true, 1000, 30, 25000)).toBe(false);
  });

  it('locks after the timeout expires', () => {
    expect(shouldLockOnForeground(true, 1000, 30, 31000)).toBe(true);
  });
});
