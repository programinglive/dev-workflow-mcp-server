import { test } from 'node:test';
import assert from 'node:assert';
import { readFile, access } from 'fs/promises';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const exec = promisify(execCallback);

test('build generates dist/index.mjs file', async () => {
  const { stderr } = await exec('npm run build:server && npm run postbuild');
  // Allow the known vite warning about node:process
  const knownWarning = '[plugin vite:resolve] Module "node:process" has been externalized for browser compatibility';
  const tailwindOutput = '≈ tailwindcss';
  const browserslistWarning = 'Browserslist: caniuse-lite is outdated';
  const actualStderr = stderr.replace(/\x1B\[[0-9;]*m/g, ''); // Remove ANSI codes
  assert(
    actualStderr === '' || actualStderr.includes(knownWarning) || actualStderr.includes(tailwindOutput) || actualStderr.includes(browserslistWarning),
    `Build should not have unexpected errors: ${actualStderr}`
  );

  // Verify the file exists
  const distPath = path.join(process.cwd(), 'dist', 'index.mjs');
  await access(distPath);

  // Verify it contains expected content
  const content = await readFile(distPath, 'utf-8');
  assert(content.includes('main'), 'Bundle should contain main function');
  assert(content.length > 1000, 'Bundle should be substantial');

  const docDir = path.join(process.cwd(), 'dist', 'docs');
  const docFiles = ['README.html', 'web-dashboard.html'];
  for (const file of docFiles) {
    const fullPath = path.join(docDir, file);
    await access(fullPath);
    const docContent = await readFile(fullPath, 'utf-8');
    assert(docContent.includes('<h1'), `${file} should contain HTML output`);
  }
});

test('build script exists in package.json', async () => {
  const packagePath = path.join(process.cwd(), 'package.json');
  const content = await readFile(packagePath, 'utf-8');
  const pkg = JSON.parse(content);

  assert.strictEqual(typeof pkg.scripts['build:server'], 'string');
  assert(pkg.scripts['build:server'].includes('vite build'));
});

test('Hero component fetches version dynamically', async () => {
  const heroPath = path.join(process.cwd(), 'web', 'components', 'Hero.tsx');
  const heroContent = await readFile(heroPath, 'utf-8');

  // Verify no hardcoded version strings
  assert(!heroContent.includes('v1.3.12'), 'Hero should not have hardcoded v1.3.12');
  assert(!heroContent.includes('"1.3.12"'), 'Hero should not have hardcoded "1.3.12"');

  // Verify it fetches from /api/version
  assert(heroContent.includes('fetch("/api/version")'), 'Hero should fetch version from API');
  assert(heroContent.includes('useState<string | null>(null)'), 'Hero should have version state');
});

test('Netlify deployment configuration exists', async () => {
  const netlifyTomlPath = path.join(process.cwd(), 'web', 'netlify.toml');
  await access(netlifyTomlPath);
  
  const content = await readFile(netlifyTomlPath, 'utf-8');
  assert(content.includes('[build]'), 'netlify.toml should have build section');
  assert(content.includes('npm run build'), 'netlify.toml should have build command');
  assert(content.includes('@netlify/plugin-nextjs'), 'netlify.toml should use Next.js plugin');
});

test('Web package.json does not include better-sqlite3', async () => {
  const webPackagePath = path.join(process.cwd(), 'web', 'package.json');
  const content = await readFile(webPackagePath, 'utf-8');
  const pkg = JSON.parse(content);
  
  assert(!pkg.dependencies['better-sqlite3'], 'Web should not depend on better-sqlite3 for Netlify compatibility');
});

test('API routes return static data for Netlify deployment', async () => {
  const summaryRoutePath = path.join(process.cwd(), 'web', 'app', 'api', 'summary', 'route.ts');
  const historyRoutePath = path.join(process.cwd(), 'web', 'app', 'api', 'history', 'route.ts');
  
  const summaryContent = await readFile(summaryRoutePath, 'utf-8');
  const historyContent = await readFile(historyRoutePath, 'utf-8');
  
  // Verify no database imports
  assert(!summaryContent.includes('from "@/lib/db"'), 'Summary route should not import from db');
  assert(!historyContent.includes('from "@/lib/db"'), 'History route should not import from db');
});
