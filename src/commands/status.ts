import path from 'node:path';
import chalk from 'chalk';
import { loadManifest, pathExists, type ContextManifest } from '../utils/config.js';
import { readRegistry } from '../core/registry.js';
import { collectProjectStatus } from '../core/sessions.js';
import type { SessionStatusEntry } from '../core/session-status.js';

interface StatusOpts {
  json?: boolean;
  /** One or more orchestrator directories (repeatable `--project <dir>`). */
  project?: string[];
  /** Use every project linked to the dashboard registry, even inside an orchestrator. */
  all?: boolean;
}

/**
 * Which orchestrators to report on:
 *   --project <dir> (repeatable) → exactly those;
 *   --all → every project in the dashboard registry (~/.context-agents/dashboard.json);
 *   otherwise → the current directory when it is an orchestrator, else the registry projects.
 */
export async function resolveProjectDirs(opts: StatusOpts, cwd: string = process.cwd()): Promise<string[]> {
  if (opts.project?.length) return opts.project.map((p) => path.resolve(cwd, p));
  const isOrchestrator = await pathExists(path.join(cwd, 'context-manifest.json'));
  if (isOrchestrator && !opts.all) return [cwd];
  const reg = await readRegistry();
  const fromRegistry = (reg?.projects ?? []).map((p) => path.resolve(p.path));
  if (fromRegistry.length) return [...new Set(fromRegistry)];
  return isOrchestrator ? [cwd] : [];
}

export async function collectStatus(dirs: string[]): Promise<SessionStatusEntry[]> {
  const rows: SessionStatusEntry[] = [];
  for (const dir of dirs) {
    if (!(await pathExists(dir))) {
      process.stderr.write(`status: project directory not found: ${dir}\n`);
      process.exitCode = 1;
      continue;
    }
    rows.push(...(await collectProjectStatus(dir)));
  }
  return rows;
}

const STATUS_COLOR: Record<string, (s: string) => string> = {
  running: chalk.yellow,
  awaiting_approval: chalk.magenta,
  blocked: chalk.red,
  done: chalk.green,
  pr_open: chalk.cyan,
  merged: chalk.gray,
  planned: chalk.white,
};

function printManifest(manifest: ContextManifest): void {
  console.log(chalk.bold(manifest.project) + chalk.gray(` — ${manifest.description ?? ''}`));
  console.log(chalk.gray(`Repositories (${manifest.repositories.length}):`));
  for (const r of manifest.repositories) {
    const hints = r.hints?.length ? chalk.gray(' — ' + r.hints.join(', ')) : '';
    console.log(`  • ${r.id} [${r.role}]${hints}`);
  }
  const risk = manifest.orchestration?.riskSignals ?? [];
  if (risk.length) console.log(chalk.gray(`\nRisk signals: ${risk.join(', ')}`));
}

function printSession(s: SessionStatusEntry): void {
  const color = STATUS_COLOR[s.status] ?? ((x: string) => x);
  const title = s.title ? chalk.gray(' · ' + s.title) : '';
  const legacy = s.legacy ? chalk.gray(' (inferred)') : '';
  console.log(`  • ${s.issueId}${title}  ${color(s.status)} ${chalk.gray('[' + s.phase + ']')}${legacy}`);
  for (const n of s.needsHuman) {
    console.log(chalk.magenta(`      ⚑ waiting on you (${n.kind}): ${n.reason}`));
    if (n.howToResolve) console.log(chalk.gray(`        → ${n.howToResolve}`));
  }
}

export async function statusCommand(opts: StatusOpts = {}): Promise<void> {
  const cwd = process.cwd();

  if (opts.json) {
    const rows = await collectStatus(await resolveProjectDirs(opts, cwd));
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    return;
  }

  console.log(chalk.bold('\nContext-First Agents — status\n'));
  const explicit = Boolean(opts.project?.length || opts.all);
  const manifest = explicit ? null : await loadManifest(cwd);
  if (!explicit && !manifest) {
    console.log(chalk.yellow('No context-manifest.json here.'));
    console.log(chalk.gray('Use --project <dir> or --all (dashboard projects); --json for machine-readable output.\n'));
    return;
  }
  if (manifest) printManifest(manifest);

  const rows = await collectStatus(await resolveProjectDirs(opts, cwd));
  const byProject = new Map<string, SessionStatusEntry[]>();
  for (const r of rows) byProject.set(r.project, [...(byProject.get(r.project) ?? []), r]);
  for (const [project, sessions] of byProject) {
    const heading = explicit ? `${project} — Sessions` : 'Sessions';
    console.log(chalk.bold(`\n${heading} (${sessions.length}):`));
    sessions.forEach(printSession);
  }
  console.log('');
}
