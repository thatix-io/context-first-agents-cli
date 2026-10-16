import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function tmpDir(prefix = 'cfa-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Write a file tree: { 'a/b.json': {...} | 'text' }. Objects are JSON-encoded. */
export function writeTree(root: string, tree: Record<string, unknown>): void {
  for (const [rel, content] of Object.entries(tree)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
}

export function readJsonl(file: string): Array<Record<string, unknown>> {
  return fs
    .readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}
