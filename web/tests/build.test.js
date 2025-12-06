/**
 * Build Verification Tests
 * Tests that the website builds successfully and key features are present
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(__dirname, '..');
const outDir = path.join(webDir, 'out');

describe('Build Tests', () => {
  test('should build successfully', () => {
    execSync('npm run build', { cwd: webDir, stdio: 'pipe' });
    expect(fs.existsSync(outDir)).toBe(true);
  });

  test('should generate homepage', () => {
    const indexPath = path.join(outDir, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('Dev Workflow');
  });

  test('should include dark mode support', () => {
    const indexPath = path.join(outDir, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('dark:');
  });

  test('should include responsive design', () => {
    const indexPath = path.join(outDir, 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('sm:');
    expect(content).toContain('md:');
    expect(content).toContain('lg:');
  });
});

describe('Theme Toggle Tests', () => {
  test('should have theme persistence', () => {
    const navbarPath = path.join(webDir, 'components', 'Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');
    expect(content).toContain('localStorage');
  });

  test('should detect system preference', () => {
    const navbarPath = path.join(webDir, 'components', 'Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');
    expect(content).toContain('prefers-color-scheme');
  });
});

describe('Responsive Design Tests', () => {
  test('should optimize for vertical monitors', () => {
    const heroPath = path.join(webDir, 'components', 'Hero.tsx');
    const content = fs.readFileSync(heroPath, 'utf-8');
    expect(content).toContain('xl:grid-cols-2');
  });

  test('should have responsive navbar', () => {
    const navbarPath = path.join(webDir, 'components', 'Navbar.tsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');
    expect(content).toContain('md:hidden');
  });
});
