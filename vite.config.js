import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https://res.cloudinary.com https://images.unsplash.com https://r2cart.in https://*.r2cart.in data: blob:; connect-src 'self' https://r2cart-backend-joyh.onrender.com https://*.onrender.com https://r2cart.in https://*.r2cart.in https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://fcm.googleapis.com; worker-src 'self' blob:; frame-src 'self' https://r2cart.firebaseapp.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: SECURITY_HEADERS
  },
  preview: {
    headers: SECURITY_HEADERS
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Charts only needed for admin analytics
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'vendor-charts';
          }
          // ExcelJS only needed for admin product/order exports
          if (id.includes('exceljs') || id.includes('fflate') || id.includes('jszip')) {
            return 'vendor-excel';
          }
          // Firebase authentication and push messaging
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Core React framework
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/') ||
            id.includes('\\react\\') ||
            id.includes('\\react-dom\\') ||
            id.includes('\\react-router\\') ||
            id.includes('\\react-router-dom\\')
          ) {
            return 'vendor-react-core';
          }
        }
      }
    }
  }
});
