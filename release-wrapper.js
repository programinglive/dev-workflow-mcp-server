#!/usr/bin/env node

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveStateFile } from './workflow-state.js';

const RELEASE_TYPES = new Set(['major', 'minor', 'patch']);

async function readStateCandidate(filePath) {
  if (!filePath) {
    return null;
  }

  try {
    const [raw, stats] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
    return {
      state: JSON.parse(raw),
      path: filePath,
      mtimeMs: stats.mtimeMs,
    };
  } catch {
    return null;
  }
}

async function loadWorkflowStateCandidates(projectRoot) {
  const candidates = [];

  try {
    candidates.push(resolveStateFile());
  } catch {
    // resolver may throw before state exists; fall through to other candidates
  }

  const legacyStatePath = path.join(projectRoot, '.state', 'workflow-state.json');
  candidates.push(legacyStatePath);

  // Add explicit DEV_WORKFLOW_STATE_FILE if provided (resolver would have used it, but keep explicit just in case)
  if (process.env.DEV_WORKFLOW_STATE_FILE) {
    candidates.push(path.resolve(process.env.DEV_WORKFLOW_STATE_FILE));
  }

  const seen = new Set();
  let freshest = null;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const resolved = path.resolve(candidate);
    if (seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);

    const result = await readStateCandidate(resolved);
    if (!result) {
      continue;
    }

    if (!freshest || result.mtimeMs > freshest.mtimeMs) {
      freshest = result;
    }
  }

  return freshest;
}

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

  const result = await loadWorkflowStateCandidates(projectRoot);
  if (!result) {
    console.error(
      `❌ Release guard: cannot locate workflow state under ${path.join(projectRoot, '.state')}.
Make sure the dev-workflow MCP is installed and you have started a task.`
    );
    process.exit(1);
  }

  const { state, path: statePath } = result;

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
