import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the bundled templates directory. Works both from src (dev via tsx)
 * and from dist (published package), since copy-templates mirrors the tree.
 */
export function templatesDir(): string {
  // dist/utils/paths.js -> dist/templates ; src/utils/paths.ts -> ../templates
  return path.resolve(here, '..', '..', 'templates');
}

/** Local path of a repo relative to the orchestrator (defaults to ../<id>). */
export function repoLocalPath(orchestratorDir: string, repo: { id: string; path?: string }): string {
  return path.resolve(orchestratorDir, repo.path ?? path.join('..', repo.id));
}
