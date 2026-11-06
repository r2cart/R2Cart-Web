import { env } from '../config/env';

export function mediaUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  // Blob or inline data URLs don't need transformation
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  try {
    const rawOrigin = env.apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const origin = new URL(rawOrigin, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000').origin;

    // Normalize Windows backslashes
    let normalized = trimmed.replace(/\\/g, '/');

    // Handle relative paths without leading slash
    if (normalized.startsWith('uploads/')) {
      normalized = '/' + normalized;
    }

    if (normalized.startsWith('/uploads/')) {
      return new URL(normalized, origin).href;
    }

    // Handle full URLs pointing to uploads directory
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      const url = new URL(normalized);
      if (url.pathname.includes('/uploads/')) {
        const uploadPath = url.pathname.substring(url.pathname.indexOf('/uploads/'));
        return new URL(uploadPath, origin).href;
      }
      return normalized;
    }

    // Relative path fallback
    if (normalized.includes('/uploads/')) {
      const uploadPath = normalized.substring(normalized.indexOf('/uploads/'));
      return new URL(uploadPath, origin).href;
    }

    return normalized;
  } catch {
    return trimmed;
  }
}
