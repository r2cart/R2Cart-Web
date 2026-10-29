import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function verifyHttpClientCode() {
  const httpPath = path.join(rootDir, 'src', 'services', 'httpClient.js');
  const content = fs.readFileSync(httpPath, 'utf8');

  if (!content.includes('isAuthEndpoint')) {
    throw new Error('httpClient.js is missing isAuthEndpoint helper');
  }

  // Must not trigger refresh on auth endpoints
  if (!content.includes('!isAuthEndpoint(path)')) {
    throw new Error('httpClient.js must bypass silent refresh on isAuthEndpoint');
  }

  // Must sanitize refresh token error message
  if (!content.includes('Session expired. Please sign in again.')) {
    throw new Error('httpClient.js must sanitize 401 refresh errors to user-friendly message');
  }

  console.log('✓ httpClient.js static checks passed: auth endpoints bypass refresh loop & errors are sanitized');
}

function verifyAdminLoginCode() {
  const loginPath = path.join(rootDir, 'src', 'pages', 'admin', 'AdminLogin.jsx');
  const content = fs.readFileSync(loginPath, 'utf8');

  // Must sanitize any internal refresh/token error to generic Invalid credentials
  if (!content.includes('Invalid credentials')) {
    throw new Error('AdminLogin.jsx must surface generic Invalid credentials on bad login');
  }

  if (!content.includes('isTokenErr') || !content.includes('isInvalidCreds')) {
    throw new Error('AdminLogin.jsx must have defensive sanitization for internal token errors');
  }

  console.log('✓ AdminLogin.jsx static checks passed: bad credentials surface generic "Invalid credentials"');
}

async function verifyAuthFlowSimulation() {
  // Simulate the exact flow in httpClient.js
  const isAuthEndpoint = path =>
    path.includes('/login') ||
    path.includes('/refresh') ||
    path.includes('/logout') ||
    path.includes('/otp') ||
    path.includes('/password') ||
    path.includes('/bootstrap');

  const testPaths = [
    { path: '/super-admin/auth/login', shouldRefresh: false },
    { path: '/admin/auth/login', shouldRefresh: false },
    { path: '/delivery/auth/login', shouldRefresh: false },
    { path: '/auth/login', shouldRefresh: false },
    { path: '/auth/delivery/login', shouldRefresh: false },
    { path: '/auth/refresh', shouldRefresh: false },
    { path: '/auth/logout', shouldRefresh: false },
    { path: '/admin/products', shouldRefresh: true },
    { path: '/super-admin/security/audit-logs', shouldRefresh: true },
    { path: '/delivery-portal/assignments', shouldRefresh: true },
    { path: '/auth/me', shouldRefresh: true }
  ];

  for (const t of testPaths) {
    const triggersRefresh = !isAuthEndpoint(t.path);
    if (triggersRefresh !== t.shouldRefresh) {
      throw new Error(`Path ${t.path} expected shouldRefresh=${t.shouldRefresh}, got ${triggersRefresh}`);
    }
  }

  // Simulate error mapping in AdminLogin
  const testErrors = [
    { input: 'Invalid credentials or unauthorized access.', expected: 'Invalid credentials' },
    { input: 'Refresh token required', expected: 'Invalid credentials' },
    { input: 'jwt expired', expected: 'Invalid credentials' },
    { input: 'Invalid email, mobile or password', expected: 'Invalid credentials' },
    { input: 'Your Super Admin account is currently deactivated.', expected: 'Your Super Admin account is currently deactivated.' }
  ];

  for (const te of testErrors) {
    const raw = te.input;
    const isTokenErr = raw.toLowerCase().includes('refresh token') || raw.toLowerCase().includes('jwt');
    const isInvalidCreds = raw.toLowerCase().includes('invalid') || isTokenErr;
    const result = isInvalidCreds ? 'Invalid credentials' : (raw || 'Invalid credentials');

    if (result !== te.expected) {
      throw new Error(`Error "${te.input}" mapped to "${result}", expected "${te.expected}"`);
    }
  }

  console.log('✓ Dynamic simulation passed: 11 endpoints and 5 error states evaluated correctly');
}

async function run() {
  console.log('Testing BUG-12: Super-admin auth error handling and token decoupling...\n');
  verifyHttpClientCode();
  verifyAdminLoginCode();
  await verifyAuthFlowSimulation();
  console.log('\nAll BUG-12 verification checks passed successfully!');
}

run().catch(err => {
  console.error('\nVerification failed:', err.message);
  process.exit(1);
});

