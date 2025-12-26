import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { WorkflowState } from "../workflow-state.js";
import { shellEscape } from "../utils.js";
import { determineReleaseTypeFromCommit, createCommitMessageParts } from "../commit-helpers.js";

export async function withWorkflowState(callback) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "workflow-handlers-"));
  const stateFile = path.join(tempDir, "state.json");
  const state = new WorkflowState(stateFile);
  await state.load();

  try {
    await callback(state);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export const testUtils = {
  shellEscape,
  determineReleaseTypeFromCommit,
  createCommitMessageParts,
};

export function createRequest(name, args) {
  return {
    params: {
      name,
      arguments: args,
    },
  };
}

export function createGitMock(overrides = {}) {
  return {
    hasWorkingChanges: async () => false,
    hasStagedChanges: async () => false,
    hasTestChanges: async () => true,
    getStagedChanges: async () => [],
    getCurrentBranch: async () => "main",
    getPrimaryBranch: async () => "main",
    getLastCommitMessage: async () => "",
    getStatusOutput: async () => "",
    containsTestFilesInStatus: (statusOutput) => statusOutput.includes("tests/"),
    workingTreeSummary: () => ({ hasChanges: false, lines: [] }),
    ...overrides,
  };
}
