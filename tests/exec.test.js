import { test } from 'node:test';
import assert from 'node:assert';
import { exec } from '../exec.js';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';
import path from 'path';

test('exec runs commands successfully', async () => {
  const echoCommand = process.platform === 'win32' ? 'echo hello world' : 'echo "hello world"';
  const { stdout } = await exec(echoCommand);
  const normalized = stdout.trim().replace(/^"(.*)"$/, '$1');
  assert.strictEqual(normalized, 'hello world');
});

test('exec respects explicit cwd option', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'mcp-test-'));
  
  try {
    const dirCommand = process.platform === 'win32' ? 'cd' : 'pwd';
    const { stdout } = await exec(dirCommand, { cwd: tempDir });
    // Just verify it runs in the specified directory (path may vary by platform)
    assert(stdout.trim().toLowerCase().includes('mcp-test-'));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('exec handles command errors', async () => {
  try {
    await exec('command-that-does-not-exist');
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert(error.code !== undefined || error.message.includes('command-not-found'));
  }
});
