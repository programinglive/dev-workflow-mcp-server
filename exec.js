import { exec as execCallback } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execPromise = promisify(execCallback);

function findRepoRoot(startDir) {
  if (!startDir) {
    return null;
  }

  let current = path.resolve(startDir);
  const { root } = path.parse(current);

  while (true) {
    if (existsSync(path.join(current, ".git"))) {
      return current;
    }

    if (current === root) {
      return null;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function getDefaultCwd() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidateDirs = [process.cwd(), process.env.INIT_CWD, moduleDir];
  return candidateDirs.reduce((resolved, candidate) => {
    if (resolved) {
      return resolved;
    }
    return findRepoRoot(candidate) || null;
  }, null) || process.cwd();
}

export function exec(command, options = {}) {
  const execOptions = options.cwd ? options : { ...options, cwd: getDefaultCwd() };
  return execPromise(command, execOptions);
}
