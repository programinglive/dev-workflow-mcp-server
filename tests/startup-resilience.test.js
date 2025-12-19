import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

test('Server startup performance and resilience', async (t) => {
    await t.test('Server starts in under 2 seconds (Studio timeout safety)', async () => {
        const start = Date.now();
        const server = spawn('node', [path.join(ROOT, 'index.js')], {
            env: { ...process.env, DEV_WORKFLOW_DB_TYPE: 'sqlite' },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        return new Promise((resolve, reject) => {
            let output = '';
            const timeout = setTimeout(() => {
                server.kill();
                reject(new Error('Server timed out starting'));
            }, 5000);

            server.stderr.on('data', (data) => {
                output += data.toString();
                if (output.includes('running on stdio')) {
                    const duration = Date.now() - start;
                    console.log(`Verified startup duration: ${duration}ms`);
                    assert.ok(duration < 2000, `Startup should be fast (took ${duration}ms)`);
                    clearTimeout(timeout);
                    server.kill();
                    resolve();
                }
            });

            server.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    });

    await t.test('Resilience: Server starts even with unreachable database', async () => {
        const server = spawn('node', [path.join(ROOT, 'index.js')], {
            env: {
                ...process.env,
                DEV_WORKFLOW_DB_TYPE: 'postgres',
                DEV_WORKFLOW_DB_URL: 'postgres://user:pass@1.2.3.4:5432/invalid'
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        return new Promise((resolve, reject) => {
            let output = '';
            const timeout = setTimeout(() => {
                server.kill();
                reject(new Error('Server hung on unreachable DB'));
            }, 15000); // Allow time for the 5s DB timeout + startup

            server.stderr.on('data', (data) => {
                output += data.toString();
                if (output.includes('running on stdio')) {
                    assert.ok(true, 'Server started despite invalid DB');
                    clearTimeout(timeout);
                    server.kill();
                    resolve();
                }
            });
        });
    });
});
