const userCredentials = new Map<string, { resendApiKey: string; updatedAt: string }>();

export function getStoredKeyForUser(userId: string): string | undefined {
  return userCredentials.get(userId)?.resendApiKey;
}

export function getStoredCredentialMeta(userId: string): { resendApiKey: string; updatedAt: string } | undefined {
  return userCredentials.get(userId);
}

export function setStoredKeyForUser(userId: string, resendApiKey: string): void {
  userCredentials.set(userId, {
    resendApiKey,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteStoredKeyForUser(userId: string): void {
  userCredentials.delete(userId);
}