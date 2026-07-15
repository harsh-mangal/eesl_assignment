#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const typescriptPath = path.join(root, 'server', 'node_modules', 'typescript', 'lib', 'typescript.js');

if (!fs.existsSync(typescriptPath)) {
  console.error('TypeScript is not installed. Run npm ci in server first.');
  process.exit(1);
}

const ts = await import(pathToFileURL(typescriptPath).href);
const sourceRoots = ['server/src', 'server/prisma', 'admin/src', 'mobile/src'];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(fullPath);
  }
}

for (const relative of sourceRoots) {
  const absolute = path.join(root, relative);
  if (fs.existsSync(absolute)) walk(absolute);
}

const failures = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });

  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const position = diagnostic.start == null
      ? ''
      : (() => {
          const sf = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true);
          const lc = sf.getLineAndCharacterOfPosition(diagnostic.start);
          return `:${lc.line + 1}:${lc.character + 1}`;
        })();
    failures.push(`${path.relative(root, file)}${position} ${message}`);
  }
}

if (failures.length) {
  console.error(`Syntax transpilation failed (${failures.length} errors):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Syntax transpilation passed for ${files.length} TypeScript/TSX files.`);
