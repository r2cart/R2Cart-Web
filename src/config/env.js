export const env={
 apiBaseUrl:import.meta.env.VITE_API_BASE_URL||'https://r2cart-backend.onrender.com/api/v1',
 requestTimeout:Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS||25000),
 useMocks:false
};
