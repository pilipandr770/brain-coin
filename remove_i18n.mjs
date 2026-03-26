// remove_i18n.mjs — replaces all t() calls with inline German strings
import fs from 'fs';
import path from 'path';

// ── 1. Load + flatten de.json ─────────────────────────────────────────────
const deJson = JSON.parse(fs.readFileSync('frontend/src/locales/de.json', 'utf8'));

function flatten(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(result, flatten(v, key));
    else result[key] = String(v);
  }
  return result;
}
const de = flatten(deJson);

// ── 2. Helper: escape regex special chars ────────────────────────────────
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── 3. Replace t() calls in a string ────────────────────────────────────
function replaceTCalls(src) {
  // t('key', 'fallback')  — prefer de.json value, fall back to fallback string
  src = src.replace(/t\('([^']+)',\s*'([^']*)'\)/g, (_, key, fallback) => {
    const val = de[key] ?? fallback;
    return `'${val}'`;
  });
  // t("key", "fallback")
  src = src.replace(/t\("([^"]+)",\s*"([^"]*)"\)/g, (_, key, fallback) => {
    const val = de[key] ?? fallback;
    return `'${val}'`;
  });
  // t('key', "fallback")  mixed quotes
  src = src.replace(/t\('([^']+)',\s*"([^"]*)"\)/g, (_, key, fallback) => {
    const val = de[key] ?? fallback;
    return `'${val}'`;
  });
  // t("key", 'fallback')  mixed quotes
  src = src.replace(/t\("([^"]+)",\s*'([^']*)'\)/g, (_, key, fallback) => {
    const val = de[key] ?? fallback;
    return `'${val}'`;
  });
  // t('simple.key')  — no fallback, static dot-notation key only
  src = src.replace(/t\('([A-Za-z0-9_.]+)'\)/g, (orig, key) => {
    if (de[key]) return `'${de[key]}'`;
    return orig; // leave dynamic ones unchanged
  });
  // t("simple.key")
  src = src.replace(/t\("([A-Za-z0-9_.]+)"\)/g, (orig, key) => {
    if (de[key]) return `'${de[key]}'`;
    return orig;
  });
  return src;
}

// ── 4. Strip i18n infrastructure lines ──────────────────────────────────
function stripI18nInfra(src) {
  // imports
  src = src.replace(/import \{ useTranslation \} from ['"]react-i18next['"];\r?\n/g, '');
  src = src.replace(/import i18n from ['"][^'"]*i18n[^'"]*['"];\r?\n/g, '');
  src = src.replace(/import ['"][./]+i18n(\.js)?['"];\r?\n/g, '');
  // hook destructure lines (with various spacing)
  src = src.replace(/[ \t]*const \{ t(?:, i18n)? \} = useTranslation\(\);\r?\n/g, '');
  src = src.replace(/[ \t]*const \{ t \}\s*=\s*useTranslation\(\);\r?\n/g, '');
  src = src.replace(/[ \t]*const \{ i18n \} = useTranslation\(\);\r?\n/g, '');
  src = src.replace(/[ \t]*const \{ t, i18n \}\s*=\s*useTranslation\(\);\r?\n/g, '');
  return src;
}

// ── 5. Collect all .jsx / .js files under frontend/src ──────────────────
function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') {
      files.push(...collectFiles(fullPath));
    } else if (e.isFile() && /\.(jsx?|tsx?)$/.test(e.name) && e.name !== 'i18n.js') {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = 'frontend/src';
const files = collectFiles(srcDir);

let changed = 0;
for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  if (!orig.includes("useTranslation") && !orig.includes("i18n")) continue;

  let updated = replaceTCalls(orig);
  updated = stripI18nInfra(updated);

  if (updated !== orig) {
    fs.writeFileSync(f, updated, 'utf8');
    console.log('Updated:', path.relative(srcDir, f));
    changed++;
  }
}
console.log(`\nDone. ${changed} files updated.`);
