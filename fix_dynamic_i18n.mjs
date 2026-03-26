// fix_dynamic_i18n.mjs — fixes the remaining dynamic t() and i18n references
import fs from 'fs';

const base = 'frontend/src';
const r = (fp) => fs.readFileSync(`${base}/${fp}`, 'utf8');
const w = (fp, c) => fs.writeFileSync(`${base}/${fp}`, c, 'utf8');

const GRADES_CONST = `const GRADES = { '5': 'Klasse 5', '6': 'Klasse 6', '7': 'Klasse 7', '8': 'Klasse 8', '9': 'Klasse 9' };\n`;
const STATUS_CONST = `const STATUS_LABELS = { active: 'Aktiv', pending: 'Ausstehend', completed: 'Abgeschlossen', rejected: 'Abgelehnt' };\n`;

// ─── 1. AuthContext.jsx ───────────────────────────────────────────────────────
{
  let c = r('context/AuthContext.jsx');
  // Remove the "Apply language" block (3 lines)
  c = c.replace(
    /\s*\/\/ Apply the user's saved language preference\n\s*if \(userData\.ui_language\) \{\n\s*i18n\.changeLanguage\(userData\.ui_language\);\n\s*localStorage\.setItem\('bc_lang', userData\.ui_language\);\n\s*\}\n/g,
    '\n'
  );
  w('context/AuthContext.jsx', c);
  console.log('✓ AuthContext.jsx');
}

// ─── 2. SplashScreen.jsx ────────────────────────────────────────────────────
{
  let c = r('screens/SplashScreen.jsx');
  // Remove LANGS const (4 lines)
  c = c.replace(/const LANGS = \[\n.*?\n.*?\n.*?\n\];\n\n/s, '');
  // Remove switchLang function
  c = c.replace(/  const switchLang = \(code\) => \{[\s\S]*?\};\n\n/m, '');
  // Remove language picker div block
  c = c.replace(/        \{\/\* Language picker \*\/\}\n        <div className="flex justify-center gap-2 mb-8">[\s\S]*?<\/div>\n\n/m, '');
  w('screens/SplashScreen.jsx', c);
  console.log('✓ SplashScreen.jsx');
}

// ─── 3. RegisterScreen.jsx ──────────────────────────────────────────────────
{
  let c = r('screens/RegisterScreen.jsx');
  // Remove changeLanguage function
  c = c.replace(/  const changeLanguage = \(code\) => \{\n    i18n\.changeLanguage\(code\);\n    localStorage\.setItem\('bc_lang', code\);\n  \};\n\n/g, '');
  // Fix payload: i18n.language || 'de' → 'de'
  c = c.replace(`ui_language: i18n.language || 'de',`, `ui_language: 'de',`);
  // Remove the flag picker div (3 flag buttons)
  c = c.replace(/          <div className="flex justify-center gap-2 mb-4">\n            \{\[\['de','🇩🇪'\],\['en','🇬🇧'\],\['uk','🇺🇦'\]\]\.map\(\(\[code, flag\]\) => \(\n              <button key=\{code\} onClick=\{/s, '          <div style={{display:"none"}}>\n            {[].map(([code, flag]) => (\n              <button key={code} onClick={');
  // Actually, let's just remove the whole flag picker block more reliably
  c = c.replace(
    /\s*<div className="flex justify-center gap-2 mb-4">\n.*?\n.*?\n.*?className=\{`text-2xl rounded-xl p-2 transition-all \$\{[\s\S]*?\}\}>\{flag\}<\/button>\n.*?\)\)}\n.*?<\/div>\n/m,
    '\n'
  );
  // Fix dynamic grade labels: {t('grades.' + g)} → {GRADES[g]}
  c = c.replace(/\{t\('grades\.' \+ g\)\}/g, '{GRADES[g]}');
  // Add GRADES const after the AVATARS const
  c = c.replace("const AVATARS = ['😊','🦁','🐯','🦊','🐸','🦄','🐉','🦅','🐺','🦋','🎮','🏆'];",
    "const AVATARS = ['😊','🦁','🐯','🦊','🐸','🦄','🐉','🦅','🐺','🦋','🎮','🏆'];\n" + GRADES_CONST);
  w('screens/RegisterScreen.jsx', c);
  console.log('✓ RegisterScreen.jsx');
}

// ─── 4. ContractView.jsx ────────────────────────────────────────────────────
{
  let c = r('screens/child/ContractView.jsx');
  // questActivated with title interpolation
  c = c.replace(
    `{t('contract_view.questActivated', { title: contract.title })}`,
    '{`Quest «${contract.title}» aktiviert!`}'
  );
  // grades dynamic
  c = c.replace(/t\('grades\.' \+ contract\.grade\)/g, "(GRADES[contract.grade] || contract.grade)");
  // i18n.language → 'de-DE'
  c = c.replace(/i18n\.language/g, "'de-DE'");
  // Add GRADES const after imports
  c = c.replace("export default function ContractView", GRADES_CONST + "\nexport default function ContractView");
  w('screens/child/ContractView.jsx', c);
  console.log('✓ ContractView.jsx');
}

// ─── 5. ContractCreator.jsx ─────────────────────────────────────────────────
{
  let c = r('screens/parent/ContractCreator.jsx');
  // subjects slug → s.name
  c = c.replace(/t\('subjects\.' \+ s\.slug,\s*\{ defaultValue: s\.name \}\)/g, 's.name');
  c = c.replace(/t\('subjects\.' \+ selectedSubject\?\.slug,\s*\{ defaultValue: selectedSubject\?\.name \}\)/g, '(selectedSubject?.name ?? \'\')');
  // grades dynamic
  c = c.replace(/\{t\('grades\.' \+ g\)\}/g, '{GRADES[g]}');
  c = c.replace(/t\('grades\.' \+ form\.grade\)/g, "(GRADES[form.grade] || form.grade)");
  // Add GRADES const  (file already has const GRADES = ['5'...] for the grade buttons array - rename it)
  // The file has: const GRADES = ['5','6','7','8','9'];  →  need to rename to GRADE_LIST
  c = c.replace("const GRADES = ['5','6','7','8','9'];", "const GRADE_LIST = ['5','6','7','8','9'];");
  c = c.replace(/\bGRADES\b(?!_LIST)/g, 'GRADE_LIST');
  // Now add GRADES lookup object after the import block
  c = c.replace("const GRADE_LIST = ['5','6','7','8','9'];",
    "const GRADE_LIST = ['5','6','7','8','9'];\n" + GRADES_CONST);
  w('screens/parent/ContractCreator.jsx', c);
  console.log('✓ ContractCreator.jsx');
}

// ─── 6. ChildHome.jsx ───────────────────────────────────────────────────────
{
  let c = r('screens/child/ChildHome.jsx');
  // grades dynamic
  c = c.replace(/t\('grades\.' \+ contract\.grade\)/g, "(GRADES[contract.grade] || contract.grade)");
  // Add GRADES const after the imports
  c = c.replace("import { useAuth } from '../../context/AuthContext';",
    "import { useAuth } from '../../context/AuthContext';\n\n" + GRADES_CONST.trim());
  w('screens/child/ChildHome.jsx', c);
  console.log('✓ ChildHome.jsx');
}

// ─── 7. ResultsScreen.jsx ───────────────────────────────────────────────────
{
  let c = r('screens/child/ResultsScreen.jsx');
  c = c.replace(/t\('grades\.' \+ contract\.grade\)/g, "(GRADES[contract.grade] || contract.grade)");
  // Add GRADES const after imports
  const firstExport = c.indexOf('export default');
  c = c.slice(0, firstExport) + GRADES_CONST + '\n' + c.slice(firstExport);
  w('screens/child/ResultsScreen.jsx', c);
  console.log('✓ ResultsScreen.jsx');
}

// ─── 8. ParentDashboard.jsx ─────────────────────────────────────────────────
{
  let c = r('screens/parent/ParentDashboard.jsx');
  // grades dynamic
  c = c.replace(/t\('grades\.' \+ child\.grade\)/g, "(GRADES[child.grade] || child.grade)");
  // status dynamic
  c = c.replace(/\{t\('parent\.status_' \+ contract\.status\)\}/g, "{STATUS_LABELS[contract.status] || contract.status}");
  // Add consts after imports
  const firstExport = c.indexOf('export default');
  c = c.slice(0, firstExport) + GRADES_CONST + STATUS_CONST + '\n' + c.slice(firstExport);
  w('screens/parent/ParentDashboard.jsx', c);
  console.log('✓ ParentDashboard.jsx');
}

// ─── 9. PaymentScreen.jsx ───────────────────────────────────────────────────
{
  let c = r('screens/parent/PaymentScreen.jsx');
  // trial_days_left with count
  c = c.replace(
    `{t('subscription.trial_days_left', { count: trialDaysLeft(), defaultValue: '{{count}} days left in trial' })}`,
    '{`${trialDaysLeft()} Tage verbleiben in der Testphase`}'
  );
  w('screens/parent/PaymentScreen.jsx', c);
  console.log('✓ PaymentScreen.jsx');
}

// ─── 10. MistakeReview.jsx ──────────────────────────────────────────────────
{
  let c = r('screens/child/MistakeReview.jsx');
  c = c.replace(/const lang = i18n\.language;/, "const lang = 'de-DE';");
  w('screens/child/MistakeReview.jsx', c);
  console.log('✓ MistakeReview.jsx');
}

// ─── 11. ParentStats.jsx ────────────────────────────────────────────────────
{
  let c = r('screens/parent/ParentStats.jsx');
  c = c.replace(/const lang = i18n\.language;/, "const lang = 'de-DE';");
  w('screens/parent/ParentStats.jsx', c);
  console.log('✓ ParentStats.jsx');
}

console.log('\nAll special cases fixed!');
