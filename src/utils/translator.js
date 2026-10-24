// Client-side intelligent automatic translation to Hindi with persistent caching
const memoryCache = new Map();

function getStoredCache() {
  try {
    const raw = localStorage.getItem('r2cart_auto_translations');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStoredCache(key, value) {
  try {
    const current = getStoredCache();
    current[key] = value;
    localStorage.setItem('r2cart_auto_translations', JSON.stringify(current));
  } catch {}
}

// Synchronous check from memory or localStorage
export function getCachedHindi(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (memoryCache.has(trimmed)) return memoryCache.get(trimmed);
  const stored = getStoredCache();
  if (stored[trimmed]) {
    memoryCache.set(trimmed, stored[trimmed]);
    return stored[trimmed];
  }
  return null;
}

// Async translate to natural Hindi with auto caching
export async function translateToHindi(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const cached = getCachedHindi(trimmed);
  if (cached) return cached;

  try {
    const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Translation status: ${res.status}`);
    const data = await res.json();
    let result = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      result = data[0].map(segment => segment[0]).filter(Boolean).join(' ').trim();
    }
    if (result) {
      memoryCache.set(trimmed, result);
      saveToStoredCache(trimmed, result);
      // Dispatch an event so listening UI components re-render seamlessly
      try {
        window.dispatchEvent(new CustomEvent('r2cart:translation-updated', { detail: { text: trimmed, hi: result } }));
      } catch {}
      return result;
    }
  } catch (err) {
    // Return original text on fallback
  }

  return trimmed;
}

// Batch background pre-fetch for uncached product names
export function prefetchTranslations(names = []) {
  if (!Array.isArray(names)) return;
  const missing = names.filter(n => n && !getCachedHindi(n.trim()));
  if (!missing.length) return;

  // Process top 10 unique missing in background
  const unique = Array.from(new Set(missing.map(n => n.trim()))).slice(0, 15);
  unique.forEach((name, idx) => {
    setTimeout(() => {
      translateToHindi(name);
    }, idx * 120);
  });
}
