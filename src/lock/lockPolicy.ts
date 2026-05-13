export function shouldLockOnForeground(
  biometricLockEnabled: boolean,
  lastBackgroundAt: number | null,
  lockAfterSeconds: number,
  now: number,
) {
  if (!biometricLockEnabled || lastBackgroundAt === null) {
    return false;
  }

  return now - lastBackgroundAt >= lockAfterSeconds * 1000;
}
