let resolvedUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

// In Production (Vercel): ALWAYS ensure high-speed Singapore backend, never allow localhost
if (import.meta.env.PROD) {
  if (!resolvedUrl || resolvedUrl.includes('localhost') || (resolvedUrl.includes('r2cart-backend.onrender.com') && !resolvedUrl.includes('r2cart-backend-joyh'))) {
    resolvedUrl = 'https://r2cart-backend-joyh.onrender.com/api/v1';
  }
} else {
  // In Local Development: allow local backend
  if (!resolvedUrl) {
    resolvedUrl = 'http://localhost:5000/api/v1';
  }
}

export const env = {
  apiBaseUrl: resolvedUrl,
  requestTimeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 35000),
  useMocks: false
};
