let resolvedUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
if (!resolvedUrl || resolvedUrl.includes('localhost:5000') || (resolvedUrl.includes('r2cart-backend.onrender.com') && !resolvedUrl.includes('r2cart-backend-joyh'))) {
  resolvedUrl = 'https://r2cart-backend-joyh.onrender.com/api/v1';
}

export const env={
  apiBaseUrl: resolvedUrl,
  requestTimeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 35000),
  useMocks: false
};

