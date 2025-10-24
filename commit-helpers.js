function formatFileList(paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  if (uniquePaths.length === 0) {
    return "updates";
  }

  if (uniquePaths.length === 1) {
    return uniquePaths[0];
  }

  if (uniquePaths.length === 2) {
    return `${uniquePaths[0]} and ${uniquePaths[1]}`;
  }

  if (uniquePaths.length === 3) {
    return `${uniquePaths[0]}, ${uniquePaths[1]}, and ${uniquePaths[2]}`;
  }

  const remaining = uniquePaths.length - 3;
  return `${uniquePaths[0]}, ${uniquePaths[1]}, ${uniquePaths[2]} +${remaining} more`;
}

function determineCommitType(changes) {
  const hasTestChange = changes.some((change) =>
    [change.path, change.originalPath].some((p) => isTestFilePath(p))
  );
  const hasDocsChange = changes.some((change) =>
    [change.path, change.originalPath].some((p) => isDocumentationFilePath(p))
  );

  if (hasTestChange) {
    return "test";
  }

  if (hasDocsChange) {
    return "docs";
  }

  return "chore";
}

function isTestFilePath(filePath) {
  if (!filePath) {
    return false;
  }

  if (/\.(test|spec)\.[^.]+$/i.test(filePath)) {
    return true;
  }

  return /(\/|^)(__tests__|tests?|spec)\//i.test(filePath);
}

function isDocumentationFilePath(filePath) {
  if (!filePath) {
    return false;
  }

  const normalized = filePath.toLowerCase();
  return (
    normalized.startsWith("docs/") ||
    normalized.startsWith("documentation/") ||
    normalized.endsWith(".md") ||
    normalized.endsWith(".rst") ||
    normalized.endsWith(".adoc") ||
    normalized.includes("readme")
  );
}

function describeChange(change) {
  const statusCode = change.status || "";
  const path = change.path || change.originalPath || "";

  if (statusCode.startsWith("R")) {
    return `renamed ${change.originalPath} -> ${change.path}`;
  }

  if (statusCode.startsWith("C")) {
    return `copied ${change.originalPath} -> ${change.path}`;
  }

  switch (statusCode[0]) {
    case "A":
      return `added ${path}`;
    case "M":
      return `modified ${path}`;
    case "D":
      return `removed ${path}`;
    case "U":
      return `updated ${path}`;
    default:
      return `${statusCode} ${path}`.trim();
  }
}

export function createCommitMessageParts(changes, providedSummary = "") {
  const summaryInput = typeof providedSummary === "string" ? providedSummary.trim() : "";

  if (!Array.isArray(changes) || changes.length === 0) {
    return {
      summary: summaryInput,
      body: "",
    };
  }

  const commitType = determineCommitType(changes);
  const summaryPaths = changes
    .map((change) => change.path || change.originalPath)
    .filter(Boolean);
  const generatedSummary = `${commitType}: update ${formatFileList(summaryPaths)}`;
  const summary = summaryInput || generatedSummary;

  const detailLines = changes
    .map((change) => describeChange(change))
    .filter((line) => line && line.trim().length > 0)
    .map((line) => `- ${line}`);

  return {
    summary,
    body: detailLines.join("\n"),
  };
}

function normalizeCommitHeader(message) {
  if (typeof message !== "string") {
    return "";
  }

  const header = message.split("\n")[0] || "";
  return header.trim();
}

function containsBreakingChange(message) {
  if (typeof message !== "string") {
    return false;
  }

  return /breaking change/i.test(message);
}

export function determineReleaseTypeFromCommit(message) {
  const header = normalizeCommitHeader(message).toLowerCase();
  const hasBreaking = containsBreakingChange(message) || /!/.test(header.split(":")[0] || "");

  if (hasBreaking) {
    return "major";
  }

  const typeMatch = header.match(/^([a-z]+)(\(|:)/i);
  const commitType = typeMatch ? typeMatch[1] : "";

  if (commitType === "feat") {
    return "minor";
  }

  if (commitType === "fix" || commitType === "perf") {
    return "patch";
  }

  if (!commitType && containsBreakingChange(message)) {
    return "major";
  }

  return "patch";
}
