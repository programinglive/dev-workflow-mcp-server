#!/usr/bin/env node

/**
 * Installation script for dev-workflow MCP server
 * Sets up per-project workflow state file in the target project directory
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function install() {
  try {
    // npm sets INIT_CWD to the directory where `npm install` was originally invoked.
    // Fallback to process.cwd() if it's not present (e.g., older npm versions).
    const projectRoot = process.env.INIT_CWD || process.cwd();

    // If INIT_CWD points inside node_modules, this script is being executed
    // while installing the package itself. In that case, skip creating a state file.
    if (projectRoot.includes(`node_modules${path.sep}`)) {
      console.log('ℹ️ Skipping workflow state creation inside node_modules.');
      return;
    }

    const stateDir = path.join(projectRoot, '.state');
    const stateFile = path.join(stateDir, 'workflow-state.json');

    // Create .state directory if it doesn't exist
    await fs.mkdir(stateDir, { recursive: true });

    // Check if state file already exists
    try {
      await fs.access(stateFile);
      console.log(`✓ Workflow state file already exists at ${stateFile}`);
      return;
    } catch {
      // File doesn't exist, create it
    }

    // Create initial workflow state
    const initialState = {
      currentPhase: 'idle',
      taskDescription: '',
      bugFixed: false,
      testsCreated: false,
      testsPassed: false,
      testsSkipped: false,
      testsSkippedReason: '',
      documentationCreated: false,
      readyToCommit: false,
      readyCheckCompleted: false,
      released: false,
      releaseCommand: '',
      releaseNotes: '',
      commitAndPushCompleted: false,
      lastCommitMessage: '',
      lastPushBranch: '',
      history: [],
    };

    await fs.writeFile(stateFile, JSON.stringify(initialState, null, 2));
    console.log(`✓ Created workflow state file at ${stateFile}`);
    console.log(`✓ Each project now has its own isolated workflow history`);
  } catch (error) {
    console.error('✗ Installation failed:', error.message);
    process.exit(1);
  }
}

install();
