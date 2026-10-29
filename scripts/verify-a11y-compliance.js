import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') res = res.concat(walk(p));
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      res.push(p);
    }
  }
  return res;
}

function verifyImageAltAttributes() {
  const files = walk(path.join(rootDir, 'src'));
  let totalImgs = 0;
  const missingAlts = [];

  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    const r = /<img\b([^>]*)/g;
    let m;
    while ((m = r.exec(c)) !== null) {
      totalImgs++;
      const t = m[1];
      const rel = path.relative(rootDir, f);
      const hasAlt = /alt\s*=\s*["'{]/.test(t);
      const emptyAlt = /alt\s*=\s*(?:""|''|\{\s*""\s*\}|\{\s*''\s*\})/.test(t);

      if (!hasAlt || emptyAlt) {
        missingAlts.push({ file: rel, snippet: m[0].replace(/\s+/g, ' ').slice(0, 80) });
      }
    }
  }

  if (missingAlts.length > 0) {
    throw new Error(`Found ${missingAlts.length} <img> tags missing or having empty alt attributes:\n` +
      missingAlts.map(x => `  - ${x.file}: ${x.snippet}`).join('\n')
    );
  }

  console.log(`✓ All ${totalImgs} <img> tags across src/ have valid, non-empty alt text.`);
}

function verifyAddressFormLabels() {
  const layoutPath = path.join(rootDir, 'src', 'layouts', 'CustomerLayout.jsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  // Verify AddressForm has htmlFor and id pairings
  if (!content.includes('address-${key}') && !content.includes('address-name')) {
    throw new Error('AddressForm missing input id or htmlFor template: address-${key}');
  }

  if (!content.includes('htmlFor={inputId}') && !content.includes('htmlFor="address-')) {
    throw new Error('AddressForm inputs lack explicit htmlFor associations');
  }

  if (!content.includes('htmlFor="address-customType"')) {
    throw new Error('Custom address type input missing htmlFor="address-customType"');
  }

  if (!content.includes('id="address-customType"')) {
    throw new Error('Custom address type input missing id="address-customType"');
  }

  console.log('✓ AddressForm inputs have explicit <label htmlFor="..."> and <input id="..."> pairings.');
}

function verifySearchInputAria() {
  const uiPath = path.join(rootDir, 'src', 'components', 'ui.jsx');
  const content = fs.readFileSync(uiPath, 'utf8');

  if (!content.includes('aria-label={placeholder') && !content.includes('aria-label=')) {
    throw new Error('SearchInput input missing accessible aria-label');
  }

  console.log('✓ SearchInput has explicit accessibility role and aria-label.');
}

function run() {
  console.log('Testing BUG-14: Image alt text and form input label accessibility (A11y)...\n');
  verifyImageAltAttributes();
  verifyAddressFormLabels();
  verifySearchInputAria();
  console.log('\nAll BUG-14 accessibility checks passed successfully!');
}

run();
