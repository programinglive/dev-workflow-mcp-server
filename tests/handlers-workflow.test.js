import test from "node:test";
import assert from "node:assert/strict";
import { handleToolCall } from "../tools/handlers.js";
import { withWorkflowState, testUtils, createRequest, createGitMock } from "./test-helpers.js";

test("run_tests guidance mentions core documentation types", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.bugFixed = true;
    workflowState.state.testsCreated = true;
    await workflowState.save();

    const response = await handleToolCall({
      request: createRequest("run_tests", {
        passed: true,
        testCommand: "npm test",
      }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: createGitMock(),
      utils: testUtils,
    });

    const text = response.content[0].text;
    assert.ok(
      text.includes("create or update documentation using 'create_documentation'"),
      "run_tests guidance should mention create or update documentation",
    );
    assert.ok(
      text.includes('"PRD", "README", "RELEASE_NOTES"'),
      "run_tests guidance should list core documentation types",
    );
  });
});

test("create_documentation verifies PRD file exists", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.testsPassed = true;
    await workflowState.save();

    const response = await handleToolCall({
      request: createRequest("create_documentation", {
        documentationType: "PRD",
        summary: "Updated PRD for documentation workflow expectations",
      }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: createGitMock(),
      utils: testUtils,
    });

    assert.equal(workflowState.state.documentationCreated, true);
    assert.equal(workflowState.state.documentationType, "PRD");
    assert.equal(
      workflowState.state.documentationSummary,
      "Updated PRD for documentation workflow expectations",
    );
    assert.ok(
      response.content[0].text.includes("Documentation created/updated!"),
      "create_documentation response should mention created/updated",
    );
    assert.ok(
      response.content[0].text.includes("PRD verified"),
      "create_documentation response should verify PRD file",
    );
  });
});

test("create_feature_flow records flow and guidance", async () => {
  await withWorkflowState(async (workflowState) => {
    workflowState.state.currentPhase = "coding";
    await workflowState.save();

    const response = await handleToolCall({
      request: createRequest("create_feature_flow", {
        mermaidCode: "graph TD; A-->B;",
        description: "Test flow implementation",
      }),
      normalizeRequestArgs: (args) => ({ args, error: null }),
      workflowState,
      exec: async () => ({ stdout: "" }),
      git: createGitMock(),
      utils: testUtils,
    });

    assert.equal(workflowState.state.featureFlowCreated, true);
    assert.equal(workflowState.state.mermaidCode, "graph TD; A-->B;");
    assert.equal(workflowState.state.featureFlowDescription, "Test flow implementation");

    const text = response.content[0].text;
    assert.ok(text.includes("✅ Feature flow recorded!"), "Should confirm recording");
    assert.ok(text.includes("Description: Test flow implementation"), "Should show description");
    assert.ok(text.includes("⏳ Fix/implement the feature"), "Should show next steps");
  });
});
