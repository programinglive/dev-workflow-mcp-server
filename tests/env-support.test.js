import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execAsync = promisify(exec);

test("Environment Configuration", async (t) => {
    await t.test("loads variables from .env file", async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "env-test-"));
        const originalCwd = process.cwd();
        const indexJsPath = path.resolve(originalCwd, "index.js");
        const indexUrl = pathToFileURL(indexJsPath).href;

        try {
            // Create a .env file
            await fs.writeFile(path.join(tmpDir, ".env"), "TEST_ENV_VAR=loaded_successfully");

            // Verify node can run and load it via index.js import
            // We import index.js to trigger the 'dotenv/config' import.
            // Since index.js starts a server if run directly, we just import it.
            // However, we need to run a script in the NEW CWD.

            const script = `
        import '${indexUrl}'; 
        console.log("VAR:" + process.env.TEST_ENV_VAR);
        process.exit(0);
      `;

            const scriptPath = path.join(tmpDir, "check_env.js");
            await fs.writeFile(scriptPath, script);

            // Execute in tmpDir
            const { stdout } = await execAsync(`node check_env.js`, { cwd: tmpDir });

            assert.ok(stdout.includes("VAR:loaded_successfully"), "Output should contain loaded variable");

        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    });
});
