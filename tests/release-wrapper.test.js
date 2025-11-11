import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const releaseWrapperUrl = new URL("../release-wrapper.js", import.meta.url);
const RELEASE_WRAPPER = fileURLToPath(releaseWrapperUrl);
const PROJECT_ROOT = path.dirname(RELEASE_WRAPPER);

async function runWrapper({ state, args = ["patch"], env = {} }) {
  const dir = await mkdtemp(path.join(tmpdir(), "release-wrapper-test-"));
  const stateDir = path.join(dir, ".state");
  const statePath = path.join(stateDir, "workflow-state.json");
  await mkdir(stateDir, { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2));

  const childEnv = {
    ...process.env,
    INIT_CWD: dir,
    DEV_WORKFLOW_SKIP_RELEASE: "1",
    DEV_WORKFLOW_FORCE_RELEASE: undefined,
    ...env,
  };

  const nodeBinary = process.platform === "win32" ? "node" : process.execPath || "node";
  const spawnShell = process.platform === "win32";

  return await new Promise((resolve) => {
    const child = spawn(
      nodeBinary,
      [RELEASE_WRAPPER, ...args],
      {
        cwd: PROJECT_ROOT,
        env: childEnv,
        stdio: ["ignore", "pipe", "pipe"],
        shell: spawnShell,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", async (code) => {
      let updatedState = null;
      try {
        const rawState = await readFile(statePath, "utf8");
        updatedState = JSON.parse(rawState);
      } catch {
        // ignore
      }

      await rm(dir, { recursive: true, force: true });
      resolve({ code, stdout, stderr, updatedState });
    });
  });
}

test("release-wrapper blocks when workflow phase is not release", async () => {
  const result = await runWrapper({
    state: {
      currentPhase: "commit",
      readyCheckCompleted: true,
      commitAndPushCompleted: true,
      released: false,
    },
  });

  assert.equal(result.code, 1);
  assert.ok(result.stderr.includes("Release guard blocked the release"));
  assert.ok(result.stderr.includes("Current workflow phase"));
  assert.equal(result.updatedState.released, false);
});

test("release-wrapper marks release after validation passes", async () => {
  const result = await runWrapper({
    state: {
      currentPhase: "release",
      readyCheckCompleted: true,
      commitAndPushCompleted: true,
      released: false,
      releaseCommand: "",
    },
  });

  assert.equal(result.code, 0);
  assert.ok(result.stdout.includes("Release recorded"));
  assert.equal(result.updatedState.released, true);
  assert.equal(result.updatedState.currentPhase, "ready_to_complete");
  assert.equal(
    result.updatedState.releaseCommand,
    "node node_modules/@programinglive/commiter/scripts/release.js patch"
  );
});
