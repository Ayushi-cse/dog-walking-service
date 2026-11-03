import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeWalkPayload } from '../js/sanitize.js';

describe('Security: XSS Input Sanitization', () => {
  it('escapes standard script tags and dangerous HTML entities', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeText(malicious);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('escapes inline event handlers and malicious image tags', () => {
    const malicious = '<img src=x onerror=alert(1) />';
    const sanitized = sanitizeText(malicious);

    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).toContain('&lt;img');
  });

  it('sanitizes quotes and ampersands to prevent attribute breakout', () => {
    const input = '" onfocus="alert(1)" name=\'hack\' & more';
    const sanitized = sanitizeText(input);

    expect(sanitized).not.toContain('"');
    expect(sanitized).not.toContain("'");
    expect(sanitized).toContain('&quot;');
    expect(sanitized).toContain('&#39;');
    expect(sanitized).toContain('&amp;');
  });

  it('handles empty, null, or undefined gracefully without throwing', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(12345)).toBe('12345');
  });

  it('sanitizes an entire walk payload object recursively and trims string fields', () => {
    const rawPayload = {
      dogName: '  <script>Buster</script>  ',
      breed: 'Golden Retriever<b>!</b>',
      ownerPhone: ' (555) 019-2834 ',
      walker: '<a href="javascript:alert(1)">Alex</a>',
      date: '2026-11-04',
      timeSlot: '09:00',
      durationMinutes: 45,
      notes: '<svg onload=alert(document.cookie)>Friendly dog, pulls on leash',
    };

    const sanitized = sanitizeWalkPayload(rawPayload);

    expect(sanitized.dogName).toBe('&lt;script&gt;Buster&lt;&#x2F;script&gt;');
    expect(sanitized.breed).toBe('Golden Retriever&lt;b&gt;!&lt;&#x2F;b&gt;');
    expect(sanitized.ownerPhone).toBe('(555) 019-2834');
    expect(sanitized.walker).not.toContain('<a href');
    expect(sanitized.durationMinutes).toBe(45);
    expect(sanitized.notes).not.toContain('<svg');
  });
});
