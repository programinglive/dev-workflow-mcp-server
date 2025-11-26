import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    root: 'web/public',
    build: {
        outDir: '../../dist/web',
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, 'web/public/index.html'),
        },
    },
    server: {
        port: 3111,
        proxy: {
            '/api': 'http://localhost:3112'
        }
    }
});
