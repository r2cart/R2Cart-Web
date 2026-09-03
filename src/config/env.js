export const env={
 apiBaseUrl:import.meta.env.VITE_API_BASE_URL||'',
 requestTimeout:Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS||10000),
 useMocks:!import.meta.env.VITE_API_BASE_URL
};
