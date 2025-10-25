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
    // Get the project root (where npm install was run)
    const projectRoot = process.cwd();
    const stateFile = path.join(projectRoot, '.workflow-state.json');

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
