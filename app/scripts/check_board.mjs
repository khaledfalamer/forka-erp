// Board screens: TypeScript check for the mistakes that matter while the screens are moved over:
// unknown names (a missing import or a typo), broken JSX, wrong JSX attributes. Full type checking comes later.
import ts from 'typescript';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'board');
const files = [join(root, 'ui.tsx'), join(root, 'Shell.tsx'), join(root, 'main.tsx'), ...readdirSync(join(root, 'views')).filter(f => f.endsWith('.tsx')).map(f => join(root, 'views', f))];
const program = ts.createProgram(files, {
  jsx: ts.JsxEmit.ReactJSX, strict: false, noImplicitAny: false, noEmit: true, skipLibCheck: true,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], types: ['vite/client'],
});
const KEEP = new Set([2304, 2552, 2305, 2724, 2307, 2322, 2769, 2559, 2353, 17004, 17008, 17002, 17014, 17015, 2657]);
const diags = ts.getPreEmitDiagnostics(program).filter(d => d.file && !d.file.fileName.endsWith('core.ts') && (KEEP.has(d.code) || d.category === ts.DiagnosticCategory.Error && d.code < 2000));
for (const d of diags) {
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start || 0);
  console.log(`${d.file.fileName.replace(root + '/', '')}:${line + 1}:${character + 1} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}
console.log(diags.length ? `\n${diags.length} Board problems` : 'Board screens: no unknown names or JSX problems');
process.exit(diags.length ? 1 : 0);
