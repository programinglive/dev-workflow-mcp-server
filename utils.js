const isWindows = process.platform === "win32";

export function shellEscape(value) {
  const stringValue = String(value);
  if (isWindows) {
    // Use PowerShell-friendly single quotes, escape embedded single quotes by doubling
    return `'${stringValue.replace(/'/g, "''")}'`;
  }

  return `'${stringValue.replace(/'/g, "'\\''")}'`;
}

export function normalizeRequestArgs(rawArgs) {
  if (rawArgs === undefined || rawArgs === null) {
    return { args: {}, error: null };
  }

  if (typeof rawArgs === "string") {
    try {
      const parsed = JSON.parse(rawArgs);
      if (parsed && typeof parsed === "object") {
        return { args: parsed, error: null };
      }

      return {
        args: {},
        error: "⚠️ Tool arguments must be a JSON object. Please provide key/value pairs.",
      };
    } catch (parseError) {
      return {
        args: {},
        error: "⚠️ Unable to parse tool arguments. Please provide valid JSON-formatted data.",
      };
    }
  }

  if (typeof rawArgs === "object") {
    return { args: rawArgs, error: null };
  }

  return {
    args: {},
    error: "⚠️ Unsupported tool arguments format. Expected a JSON object.",
  };
}
