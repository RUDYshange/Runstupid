/**
 * CSRF & Idempotency protection utilities.
 */

// Generate a cryptographic or pseudorandom hex token
export function generateToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'token-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Per-session anti-tampering token stored in memory
let sessionCsrfToken = generateToken();

export function getCsrfToken(): string {
  return sessionCsrfToken;
}

export function refreshCsrfToken(): string {
  sessionCsrfToken = generateToken();
  return sessionCsrfToken;
}

// In-flight submission lock to prevent double-click race conditions
const activeSubmissions = new Set<string>();

export function acquireSubmissionLock(formId: string): boolean {
  if (activeSubmissions.has(formId)) {
    return false; // Locked!
  }
  activeSubmissions.add(formId);
  return true;
}

export function releaseSubmissionLock(formId: string): void {
  activeSubmissions.delete(formId);
}
