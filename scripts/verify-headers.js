import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function verifyVercelHeaders() {
  const vercelPath = path.join(rootDir, 'vercel.json');
  if (!fs.existsSync(vercelPath)) {
    throw new Error('vercel.json not found');
  }

  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const headerRule = vercelConfig.headers?.find(h => h.source === '/(.*)');
  if (!headerRule) {
    throw new Error('vercel.json is missing headers configuration for /(.*)');
  }

  const headerMap = Object.fromEntries(headerRule.headers.map(h => [h.key, h.value]));

  const requiredHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options'];
  for (const h of requiredHeaders) {
    if (!headerMap[h]) {
      throw new Error(`vercel.json is missing required header: ${h}`);
    }
  }

  if (headerMap['X-Frame-Options'] !== 'DENY') {
    throw new Error(`Expected X-Frame-Options to be DENY, got: ${headerMap['X-Frame-Options']}`);
  }

  if (headerMap['X-Content-Type-Options'] !== 'nosniff') {
    throw new Error(`Expected X-Content-Type-Options to be nosniff, got: ${headerMap['X-Content-Type-Options']}`);
  }

  const csp = headerMap['Content-Security-Policy'];
  if (!csp.includes("frame-ancestors 'none'") || !csp.includes("default-src 'self'")) {
    throw new Error(`CSP is missing critical directives: ${csp}`);
  }

  console.log('✓ vercel.json headers verified successfully');
}

function verifyPublicHeaders() {
  const headersPath = path.join(rootDir, 'public', '_headers');
  if (!fs.existsSync(headersPath)) {
    throw new Error('public/_headers not found');
  }

  const content = fs.readFileSync(headersPath, 'utf8');
  if (!content.includes('Content-Security-Policy') || !content.includes('X-Frame-Options') || !content.includes('X-Content-Type-Options')) {
    throw new Error('public/_headers is missing required security headers');
  }

  console.log('✓ public/_headers verified successfully');
}

try {
  verifyVercelHeaders();
  verifyPublicHeaders();
  console.log('\nAll frontend security headers verified successfully! (Vercel Production Ready)');
} catch (err) {
  console.error('\nVerification failed:', err.message);
  process.exit(1);
}
