/**
 * Dog Walking Service - Security Module
 * Enterprise XSS Sanitization & Input Defense
 * 
 * Protects against stored & reflected cross-site scripting vulnerabilities
 * before data is stored in the application state or persisted to storage.
 */

const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escapes characters that could be leveraged for XSS in HTML or attributes.
 * @param {unknown} value Raw text input
 * @returns {string} Sanitized string safe for rendering or storage
 */
export function sanitizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  if (!str) {
    return '';
  }

  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Recursively sanitizes all string properties in a dog walk payload object
 * and trims extraneous whitespace.
 * @param {Record<string, unknown>} payload 
 * @returns {Record<string, unknown>} Sanitized copy of payload
 */
export function sanitizeWalkPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      sanitized[key] = sanitizeText(trimmed);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = '';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeWalkPayload(value);
    } else {
      sanitized[key] = sanitizeText(String(value));
    }
  }

  return sanitized;
}
