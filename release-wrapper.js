#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const RELEASE_TYPES = new Set(['major', 'minor', 'patch']);

async function main() {
  const releaseTypeArg = (process.argv[2] || '').toLowerCase();
  const forceFlag = process.argv.includes('--force') || process.env.DEV_WORKFLOW_FORCE_RELEASE === '1';

  if (!RELEASE_TYPES.has(releaseTypeArg)) {
    console.error(
      '❌ Release guard: expected release type argument (major | minor | patch). Example: npm run release:patch'
    );
    process.exit(1);
  }

  const projectRoot = process.env.INIT_CWD || process.cwd();
  if (projectRoot.includes(`node_modules${path.sep}`)) {
    console.error('❌ Release guard: refusing to run inside node_modules.');
    process.exit(1);
  }

  // Prefer state under INIT_CWD to support per-project runs and tests.
  // If DEV_WORKFLOW_USER_ID is set and a user-scoped file exists, use it; otherwise fall back to legacy path.
  const baseStateDir = path.join(projectRoot, '.state');
  const legacyStatePath = path.join(baseStateDir, 'workflow-state.json');
  let resolvedUserId = (process.env.DEV_WORKFLOW_USER_ID || '').trim();
  if (!resolvedUserId) {
    try {
      const fileUserId = (await fs.readFile(path.join(baseStateDir, 'user-id'), 'utf8')).trim();
      if (fileUserId) {
        resolvedUserId = fileUserId;
      }
    } catch {
      // no user-id file; legacy layout likely
    }
  }
  const userStatePath = resolvedUserId ? path.join(baseStateDir, 'users', resolvedUserId, 'workflow-state.json') : null;

  let statePath = legacyStatePath;
  if (userStatePath) {
    try {
      await fs.access(userStatePath);
      statePath = userStatePath;
    } catch {
      // fall back to legacy path
    }
  }
  let state;

  try {
    const raw = await fs.readFile(statePath, 'utf8');
    state = JSON.parse(raw);
  } catch (error) {
    console.error(
      `❌ Release guard: cannot locate workflow state at ${statePath}. Make sure the dev-workflow MCP is installed and you have started a task.`
    );
    process.exit(1);
  }

  const errors = [];
  if (state.currentPhase !== 'release') {
    errors.push(
      "Current workflow phase isn't 'release'. Complete documentation, commit, and push steps first."
    );
  }
  if (!state.readyCheckCompleted) {
    errors.push("'check_ready_to_commit' has not been completed.");
  }
  if (!state.commitAndPushCompleted) {
    errors.push("'commit_and_push' has not been completed.");
  }
  if (state.released) {
    errors.push('A release has already been recorded for this task.');
  }

  if (errors.length && !forceFlag) {
    console.error('❌ Release guard blocked the release:');
    for (const message of errors) {
      console.error(`  • ${message}`);
    }
    console.error("\nUse 'perform_release' through the dev-workflow MCP after completing the missing steps.");
    console.error("Or use: npm run release:patch -- --force (to bypass guard)");
    process.exit(1);
  }

  if (forceFlag && errors.length) {
    console.warn('⚠️ --force flag detected. Bypassing workflow guard.');
    console.warn('Errors that were skipped:');
    for (const message of errors) {
      console.warn(`  • ${message}`);
    }
  }

  const runRelease = async () => {
    if (process.env.DEV_WORKFLOW_SKIP_RELEASE === '1') {
      console.log('ℹ️ DEV_WORKFLOW_SKIP_RELEASE=1 detected. Skipping actual release command.');
      return 0;
    }

    return await new Promise((resolve, reject) => {
      const child = spawn(
        'npm',
        ['run', 'release', '--', '--release-as', releaseTypeArg],
        { stdio: 'inherit', shell: process.platform === 'win32', cwd: projectRoot }
      );

      child.on('error', (error) => reject(error));
      child.on('close', (code) => resolve(code));
    });
  };

  try {
    const exitCode = await runRelease();
    if (exitCode !== 0) {
      console.error(`❌ Release command exited with code ${exitCode}.`);
      process.exit(exitCode);
    }
  } catch (error) {
    console.error(`❌ Failed to run release command: ${error.message}`);
    process.exit(1);
  }

  state.released = true;
  state.releaseCommand = `npm run release:${releaseTypeArg}`;
  state.currentPhase = 'ready_to_complete';

  try {
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`❌ Release guard: failed to update workflow state. ${error.message}`);
    process.exit(1);
  }

  console.log('✅ Release recorded in workflow state. You can now run complete_task.');
}

main();
