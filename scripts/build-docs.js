import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const docs = [
  {
    key: 'README.md',
    source: path.join(projectRoot, 'README.md'),
    output: 'README.html',
  },
  {
    key: 'web-dashboard.md',
    source: path.join(projectRoot, 'docs', 'web-dashboard.md'),
    output: 'web-dashboard.html',
  },
  {
    key: 'GETTING-STARTED.md',
    source: path.join(projectRoot, 'docs', 'antigravity', 'GETTING-STARTED.md'),
    output: 'GETTING-STARTED.html',
  },
  {
    key: 'EXAMPLES.md',
    source: path.join(projectRoot, 'docs', 'antigravity', 'EXAMPLES.md'),
    output: 'EXAMPLES.html',
  },
  {
    key: 'WORKFLOW-TEMPLATES.md',
    source: path.join(projectRoot, 'docs', 'antigravity', 'WORKFLOW-TEMPLATES.md'),
    output: 'WORKFLOW-TEMPLATES.html',
  },
  {
    key: 'TROUBLESHOOTING.md',
    source: path.join(projectRoot, 'docs', 'antigravity', 'TROUBLESHOOTING.md'),
    output: 'TROUBLESHOOTING.html',
  },
];

const distDocDir = path.join(projectRoot, 'dist', 'docs');

async function buildDocs() {
  await mkdir(distDocDir, { recursive: true });

  for (const doc of docs) {
    const markdown = await readFile(doc.source, 'utf-8');
    const html = marked.parse(markdown);
    await writeFile(path.join(distDocDir, doc.output), html, 'utf-8');
  }
}

buildDocs().catch((error) => {
  console.error('Failed to build documentation assets:', error);
  process.exitCode = 1;
});
