import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'templates');
const dest = path.join(root, 'dist', 'templates');

await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log('templates copied to dist/templates');
