import { test } from 'node:test';
import assert from 'node:assert';
import { readFile, access } from 'fs/promises';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const exec = promisify(execCallback);

test('build generates dist/index.mjs file', async () => {
  const { stderr } = await exec('npm run build');
  // Allow the known vite warning about node:process
  const knownWarning = '[plugin vite:resolve] Module "node:process" has been externalized for browser compatibility';
  const tailwindOutput = '≈ tailwindcss';
  const actualStderr = stderr.replace(/\x1B\[[0-9;]*m/g, ''); // Remove ANSI codes
  assert(
    actualStderr === '' || actualStderr.includes(knownWarning) || actualStderr.includes(tailwindOutput),
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

  assert.strictEqual(typeof pkg.scripts.build, 'string');
  assert(pkg.scripts.build.includes('vite build'));
});
