import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const PROJECT_ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RELEASE_WRAPPER = path.join(PROJECT_ROOT, "release-wrapper.js");

async function runWrapper({ state, args = ["patch"], env = {} }) {
  const dir = await mkdtemp(path.join(tmpdir(), "release-wrapper-test-"));
  const statePath = path.join(dir, ".workflow-state.json");
  await writeFile(statePath, JSON.stringify(state, null, 2));

  const childEnv = {
    ...process.env,
    INIT_CWD: dir,
    DEV_WORKFLOW_SKIP_RELEASE: "1",
    ...env,
  };

  return await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [RELEASE_WRAPPER, ...args],
      {
        cwd: PROJECT_ROOT,
        env: childEnv,
        stdio: ["ignore", "pipe", "pipe"],
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
  assert.equal(result.updatedState.releaseCommand, "npm run release:patch");
});
