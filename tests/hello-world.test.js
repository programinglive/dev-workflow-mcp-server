import { test } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('hello world script runs successfully', (t) => {
    const scriptPath = path.join(__dirname, '../scripts/hello-world.js');
    const output = execSync(`node ${scriptPath}`).toString();
    assert.match(output, /Hello from Antigravity!/);
});
