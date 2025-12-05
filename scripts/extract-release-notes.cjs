#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findReleaseSection(content, version) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(version)}(?:\\s+—[^\\n]*)?`, 'm');
  const headingMatch = content.match(headingPattern);
  if (!headingMatch) {
    return null;
  }

  const startIndex = headingMatch.index;
  const afterHeadingIndex = startIndex + headingMatch[0].length;
  const rest = content.slice(afterHeadingIndex);

  const nextHeadingPattern = /^##\s+/m;
  const nextHeadingMatch = nextHeadingPattern.exec(rest);
  const sectionEnd = nextHeadingMatch ? afterHeadingIndex + nextHeadingMatch.index : content.length;

  const section = content.slice(startIndex, sectionEnd).trim();
  return section || null;
}

function main() {
  const rawVersionArg = process.argv[2];
  let version = rawVersionArg;

  if (!version) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      version = pkg.version;
    } catch {
      // ignore
    }
  }

  if (!version) {
    console.error('Unable to determine version. Provide one explicitly, e.g., node scripts/extract-release-notes.cjs 1.5.3');
    process.exit(1);
  }

  version = version.replace(/^v/i, '');

  const releaseNotesPath = path.join(process.cwd(), 'docs', 'release-notes', 'RELEASE_NOTES.md');
  if (!fs.existsSync(releaseNotesPath)) {
    console.error(`Release notes file not found at ${releaseNotesPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(releaseNotesPath, 'utf8');
  const section = findReleaseSection(content, version);

  if (!section) {
    console.warn(`No release notes section found for version ${version}.`);
    process.stdout.write(`## ${version}\n\nNo detailed release notes were found. Please refer to the CHANGELOG.\n`);
    return;
  }

  process.stdout.write(`${section.trim()}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Failed to extract release notes: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  findReleaseSection,
};
