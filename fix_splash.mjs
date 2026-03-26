import fs from 'fs';

let c = fs.readFileSync('frontend/src/screens/SplashScreen.jsx', 'utf8');

// Remove LANGS const + blank line after
c = c.replace(/const LANGS = \[[\s\S]*?\];\r?\n\r?\n/, '');

// Remove switchLang function + blank line after
c = c.replace(/  const switchLang = \(code\) => \{\s*\n    i18n\.changeLanguage\(code\);\s*\n    localStorage\.setItem\('bc_lang', code\);\s*\n  \};\s*\n\s*\n/, '');

// Remove language picker comment + div block — from "Language picker" to closing </div>
// The block ends with </div>\n\n and precedes the emoji div
c = c.replace(/\s*\{\/\* Language picker \*\/\}\s*\n\s*<div className="flex justify-center gap-2 mb-8">[\s\S]*?<\/div>\s*\n/, '\n');

fs.writeFileSync('frontend/src/screens/SplashScreen.jsx', c, 'utf8');
console.log('SplashScreen fixed.');
console.log('First 600 chars:\n', c.slice(0, 600));
