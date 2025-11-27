#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const RELEASE_TYPES = new Set(['major', 'minor', 'patch']);

async function main() {
  const releaseTypeArg = (process.argv[2] || '').toLowerCase();
  const forceFlag = process.argv.includes('--force') || process.env.DEV_WORKFLOW_FORCE_RELEASE === '1';
  const additionalArgs = process.argv.slice(3).filter((arg) => arg !== '--force');

  if (!RELEASE_TYPES.has(releaseTypeArg)) {
    console.error(
      '❌ Release guard: expected release type argument (major | minor | patch). Example: npm run release:patch'
    );
    process.exit(1);
  }

  const repoRoot = process.cwd();
  const projectRootCandidate = process.env.INIT_CWD || repoRoot;
  if (projectRootCandidate.includes(`node_modules${path.sep}`)) {
    console.error('❌ Release guard: refusing to run inside node_modules.');
    process.exit(1);
  }
  const projectRoot = projectRootCandidate;

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

  const candidateStatePaths = new Set();
  candidateStatePaths.add(legacyStatePath);
  if (userStatePath) {
    candidateStatePaths.add(userStatePath);
  }
  // Also consider the legacy default user path in case the user-id file is stale.
  candidateStatePaths.add(path.join(baseStateDir, 'users', 'default', 'workflow-state.json'));

  let statePath = null;
  let state = null;
  for (const candidate of candidateStatePaths) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      state = JSON.parse(raw);
      statePath = candidate;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!state || !statePath) {
    console.error(
      `❌ Release guard: cannot locate workflow state under ${baseStateDir}. Make sure the dev-workflow MCP is installed and you have started a task.`
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

  const commiterReleaseScript = path.join(repoRoot, 'scripts', 'release.cjs');

  try {
    await fs.access(commiterReleaseScript);
  } catch {
    console.error('❌ Release guard: @programinglive/commiter release script not found.');
    console.error('   Ensure @programinglive/commiter is installed as a dev dependency.');
    console.error('   Try: npm install --save-dev @programinglive/commiter');
    process.exit(1);
  }

  const runRelease = async () => {
    if (process.env.DEV_WORKFLOW_SKIP_RELEASE === '1') {
      console.log('ℹ️ DEV_WORKFLOW_SKIP_RELEASE=1 detected. Skipping actual release command.');
      return 0;
    }

    return await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [commiterReleaseScript, releaseTypeArg, ...additionalArgs],
        { stdio: 'inherit', cwd: repoRoot }
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

  const recordedReleaseCommand = `node node_modules/@programinglive/commiter/scripts/release.js ${releaseTypeArg}`;

  state.released = true;
  state.releaseCommand = recordedReleaseCommand;
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
