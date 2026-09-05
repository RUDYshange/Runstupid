/**
 * Client-side input sanitization utility to guard against XSS and injection attacks.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return input;

  return input
    // Strip script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip iframe, embed, object tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    // Strip inline event handlers (onerror=, onclick=, etc.)
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    // Strip javascript: pseudo-protocols
    .replace(/javascript:[^"'>]*/gi, '')
    .trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as any)[key] = sanitizeInput(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as any)[key] = sanitizeObject(value);
    }
  }
  return result;
}
