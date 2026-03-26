import fs from 'fs';
import path from 'path';

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, {withFileTypes:true});
  const files = [];
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') files.push(...collectFiles(fp));
    else if (e.isFile() && /\.(jsx|js)$/.test(e.name)) files.push(fp);
  }
  return files;
}

const files = collectFiles('frontend/src');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/\bt\(|i18n|useTranslation|LANGS\b/.test(line)) {
      console.log(path.basename(f) + ':' + (i+1) + ': ' + line.trim().substring(0,130));
    }
  });
}
