import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('Running smoke tests...');

try {
    // 1. Verify package.json type: module
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.type !== 'module') {
        throw new Error('FAIL: package.json must have "type": "module"');
    }
    console.log('✅ package.json has "type": "module"');

    // 2. Syntax check server.js
    const serverJsPath = path.join(rootDir, 'server.js');
    execSync(`node -c "${serverJsPath}"`, { stdio: 'inherit' });
    console.log('✅ server.js syntax check passed');

    console.log('All smoke tests passed!');
    process.exit(0);
} catch (error) {
    console.error('❌ Smoke test failed:', error.message);
    process.exit(1);
}
