import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';

/**
 * Local, gitignored config. Backwards-compatible with context-first-cli's .contextrc.json.
 */
export interface ContextConfig {
  orchestratorRepo: string;
  aiProvider: 'claude' | 'cursor' | 'custom';
  commandsDir: string;
  version?: string;
  createdAt?: string;
}

/**
 * A repository the runtime can target. Superset of context-first-cli's Repository:
 * adds `hints`, `context`, `testCommand`, `path` so the .md orchestration layer can
 * classify complexity and build per-agent context contracts.
 */
export interface Repository {
  id: string;
  role: 'metaspecs' | 'specs-provider' | 'application' | 'service' | 'library';
  url?: string;
  /** Local path relative to the orchestrator. Defaults to ../<id>. */
  path?: string;
  description?: string;
  mainBranch?: string;
  dependsOn?: string[];
  /** Keywords that, when present in a task, indicate this repo is impacted. */
  hints?: string[];
  /** Files/indexes an agent working on this repo is allowed to read (context contract). */
  context?: string[];
  /** Command used by the tester agent to validate this repo. */
  testCommand?: string;
}

/**
 * Orchestration policy for the .md agent layer. Read by the /orchestrate command,
 * never executed by Node.
 */
export interface OrchestrationConfig {
  /** Behavioral primitives the graph may instantiate (not domain agents). */
  archetypes?: string[];
  /** Keywords that raise task complexity / trigger adversarial review. */
  riskSignals?: string[];
  parallelism?: { maxWorkers?: number; maxPerRepository?: number };
  /** Context selection policy passed into each agent contract. */
  contextPolicy?: 'select-do-not-dump' | 'full';
  maxFilesPerWorker?: number;
  /** Project-wide context indexes every agent may consult. */
  indexes?: string[];
}

/**
 * context-manifest.json. Backwards-compatible with context-first-cli; the
 * `orchestration` block and the extra Repository fields are additive.
 */
export interface ContextManifest {
  version: string;
  project: string;
  description?: string;
  repositories: Repository[];
  orchestration?: OrchestrationConfig;
}

export interface WorkspaceMetadata {
  issueId: string;
  repositories: string[];
  language?: string;
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'archived';
}

export const DEFAULT_ARCHETYPES = [
  'planner',
  'researcher',
  'implementer',
  'reviewer',
  'tester',
  'integrator',
  'conflict-resolver',
];
// note: `planner` runs first in live orchestration — it writes the detailed plan and
// defines the workers; the graph then grows dynamically as agents reveal new work.

export const DEFAULT_RISK_SIGNALS = [
  'migration',
  'migrate',
  'payment',
  'security',
  'breaking change',
  'contract',
  'webhook',
  'auth',
];

export async function loadConfig(cwd: string = process.cwd()): Promise<ContextConfig | null> {
  try {
    const content = await fs.readFile(path.join(cwd, '.contextrc.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function findConfig(
  startDir: string = process.cwd()
): Promise<{ config: ContextConfig; configDir: string } | null> {
  let currentDir = startDir;
  while (true) {
    const config = await loadConfig(currentDir);
    if (config) return { config, configDir: currentDir };
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) return null;
    currentDir = parentDir;
  }
}

export async function loadManifest(orchestratorPath: string): Promise<ContextManifest | null> {
  try {
    const content = await fs.readFile(
      path.join(orchestratorPath, 'context-manifest.json'),
      'utf-8'
    );
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveManifest(
  orchestratorPath: string,
  manifest: ContextManifest
): Promise<void> {
  await fs.writeFile(
    path.join(orchestratorPath, 'context-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true }).catch(() => {});
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function exitWithError(message: string): never {
  console.error(chalk.red(`\n❌ ${message}\n`));
  process.exit(1);
}
