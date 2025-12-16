import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.js'),
      output: {
        entryFileNames: 'index.mjs',
        format: 'es',
      },
      external: [
        '@modelcontextprotocol/sdk',
        // Node.js built-in modules
        'node:fs',
        'node:path',
        'node:url',
        'node:util',
        'node:os',
        'node:process',
        'node:child_process',
        'fs',
        'fs/promises',
        'path',
        'url',
        'util',
        'os',
        'process',
        'child_process',
        'events',
      ],
    },
  },
  define: {
    __filename: JSON.stringify(path.resolve(__dirname, 'index.js')),
  },
});
