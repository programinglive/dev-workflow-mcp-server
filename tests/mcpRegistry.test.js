import { test } from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

async function readJson(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  const content = await readFile(fullPath, "utf-8");
  return JSON.parse(content);
}

test("package.json includes mcpName for MCP registry", async () => {
  const pkg = await readJson("package.json");

  assert.strictEqual(
    pkg.mcpName,
    "io.github.programinglive/dev-workflow-mcp-server",
    "package.json should declare mcpName matching the MCP server namespace",
  );
});

test("server.json is configured for npm package deployment", async () => {
  const server = await readJson("server.json");

  assert.strictEqual(
    server.name,
    "io.github.programinglive/dev-workflow-mcp-server",
    "server.json name should match the MCP server namespace",
  );

  assert.ok(Array.isArray(server.packages) && server.packages.length > 0,
    "server.json should declare at least one package entry",
  );

  const npmPkg = server.packages[0];

  assert.strictEqual(
    npmPkg.registry_type,
    "npm",
    "First server.json package entry should use npm registry_type",
  );

  assert.strictEqual(
    npmPkg.identifier,
    "@programinglive/dev-workflow-mcp-server",
    "server.json npm identifier should match the published npm package name",
  );

  assert.ok(
    typeof npmPkg.version === "string" && npmPkg.version.length > 0,
    "server.json npm package version should be a non-empty string",
  );
});
