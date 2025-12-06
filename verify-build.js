#!/usr/bin/env node

/**
 * Build Verification Script
 * Verifies that the website builds successfully and key features are present
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webDir = path.join(__dirname, 'web');
const outDir = path.join(webDir, 'out');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

console.log('\n🧪 Running Build Verification Tests...\n');

// Test 1: Build succeeds
test('Build completes successfully', () => {
  try {
    execSync('npm run build', { cwd: webDir, stdio: 'pipe' });
  } catch (error) {
    throw new Error('Build failed');
  }
});

// Test 2: Output directory exists
test('Output directory exists', () => {
  if (!fs.existsSync(outDir)) {
    throw new Error('Output directory not found');
  }
});

// Test 3: Index HTML exists
test('Homepage HTML generated', () => {
  const indexPath = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found');
  }
});

// Test 4: Check for key page content
test('Homepage contains "Dev Workflow"', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('Dev Workflow')) {
    throw new Error('Dev Workflow text not found');
  }
});

// Test 5: Check for hero section
test('Homepage contains hero section', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('Master Your') || !content.includes('Workflow')) {
    throw new Error('Hero section not found');
  }
});

// Test 6: Check for dark mode support
test('Dark mode classes included', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('dark:')) {
    throw new Error('Dark mode classes not found');
  }
});

// Test 7: Check for responsive design
test('Responsive design classes included', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('sm:') || !content.includes('md:') || !content.includes('lg:')) {
    throw new Error('Responsive classes not found');
  }
});

// Test 8: Check for features section
test('Features section present', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('Your Coding Conscience')) {
    throw new Error('Features section not found');
  }
});

// Test 9: Check for history section
test('History section present', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('Workflow History')) {
    throw new Error('History section not found');
  }
});

// Test 10: Check for theme toggle
test('Theme toggle button present', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  // Check for theme toggle in minified form or readable form
  if (!content.includes('toggleTheme') && !content.includes('theme') && !content.includes('Moon') && !content.includes('Sun')) {
    throw new Error('Theme toggle not found');
  }
});

// Test 11: Check for viewport meta tag
test('Viewport meta tag for mobile', () => {
  const indexPath = path.join(outDir, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('viewport') || !content.includes('width=device-width')) {
    throw new Error('Viewport meta tag not found');
  }
});

// Test 12: Check for localStorage theme persistence
test('Theme persistence in Navbar component', () => {
  const navbarPath = path.join(webDir, 'components', 'Navbar.tsx');
  const content = fs.readFileSync(navbarPath, 'utf-8');
  if (!content.includes('localStorage')) {
    throw new Error('localStorage not found in Navbar');
  }
});

// Test 13: Check for system preference detection
test('System color scheme preference detection', () => {
  const navbarPath = path.join(webDir, 'components', 'Navbar.tsx');
  const content = fs.readFileSync(navbarPath, 'utf-8');
  if (!content.includes('prefers-color-scheme')) {
    throw new Error('prefers-color-scheme not found');
  }
});

// Test 14: Check for responsive Navbar
test('Responsive Navbar implementation', () => {
  const navbarPath = path.join(webDir, 'components', 'Navbar.tsx');
  const content = fs.readFileSync(navbarPath, 'utf-8');
  if (!content.includes('md:hidden') && !content.includes('hidden md:')) {
    throw new Error('Responsive Navbar not found');
  }
});

// Test 15: Check for vertical monitor optimization
test('Vertical monitor responsive design', () => {
  const heroPath = path.join(webDir, 'components', 'Hero.tsx');
  const content = fs.readFileSync(heroPath, 'utf-8');
  if (!content.includes('xl:grid-cols-2')) {
    throw new Error('Vertical monitor optimization not found');
  }
});

console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
