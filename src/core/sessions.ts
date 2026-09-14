import fs from 'node:fs/promises';
import path from 'node:path';
import { pathExists } from '../utils/config.js';

export interface StepEvent {
  step: string;
  at?: string | null;
}

export interface WorkerState {
  id: string;
  /** Human-friendly name (role+target), e.g. "impl:front-audio". Falls back to id. */
  name?: string;
  archetype?: string;
  repository?: string | null;
  objective?: string;
  dependsOn?: string[];
  status: 'pending' | 'running' | 'done' | 'blocked' | 'unknown';
  currentStep?: string | null;
  /** Ordered history of steps this worker went through. */
  steps?: StepEvent[];
  startedAt?: string | null;
  finishedAt?: string | null;
  verdict?: string | null;
}

export interface SessionState {
  issueId: string;
  title?: string;
  complexity?: string;
  status: 'planned' | 'running' | 'blocked' | 'done' | 'unknown';
  createdAt?: string;
  updatedAt?: string;
  repos?: string[];
  waves?: string[][];
  workers: WorkerState[];
  /** true when built from execution-plan.md fallback (no state.json yet). */
  fromPlanFallback?: boolean;
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as T;
  } catch {
    return null;
  }
}

/** List session directories (skips _backlog, dotfiles). */
export async function listSessions(orchestratorDir: string): Promise<string[]> {
  const dir = path.join(orchestratorDir, '.sessions');
  if (!(await pathExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

/** Read one session's full state, falling back to execution-plan.md parsing. */
export async function readSession(orchestratorDir: string, issueId: string): Promise<SessionState> {
  const sdir = path.join(orchestratorDir, '.sessions', issueId);
  const state = await readJson<Partial<SessionState>>(path.join(sdir, 'state.json'));
  const workers: WorkerState[] = [];

  const workersDir = path.join(sdir, 'workers');
  if (await pathExists(workersDir)) {
    const files = (await fs.readdir(workersDir)).filter((f) => f.endsWith('.json'));
    for (const f of files.sort()) {
      const w = await readJson<WorkerState>(path.join(workersDir, f));
      if (w && w.id) workers.push({ ...w, status: w.status ?? 'unknown' });
    }
  }

  if (state || workers.length) {
    return {
      issueId,
      title: state?.title,
      complexity: state?.complexity,
      status: (state?.status as SessionState['status']) ?? deriveStatus(workers),
      createdAt: state?.createdAt,
      updatedAt: state?.updatedAt,
      repos: state?.repos,
      waves: state?.waves,
      workers: workers.length ? workers : wavesToWorkers(state?.waves),
    };
  }

  // Fallback: parse execution-plan.md so old sessions still render.
  return parsePlanFallback(sdir, issueId);
}

function deriveStatus(workers: WorkerState[]): SessionState['status'] {
  if (!workers.length) return 'unknown';
  if (workers.some((w) => w.status === 'blocked')) return 'blocked';
  if (workers.every((w) => w.status === 'done')) return 'done';
  if (workers.some((w) => w.status === 'running')) return 'running';
  return 'planned';
}

function wavesToWorkers(waves?: string[][]): WorkerState[] {
  if (!waves) return [];
  return waves.flat().map((id) => ({ id, status: 'unknown' as const }));
}

/** Best-effort extraction of the DAG table from execution-plan.md. */
async function parsePlanFallback(sdir: string, issueId: string): Promise<SessionState> {
  const planPath = path.join(sdir, 'execution-plan.md');
  const empty: SessionState = { issueId, status: 'unknown', workers: [], fromPlanFallback: true };
  if (!(await pathExists(planPath))) return empty;

  const text = await fs.readFile(planPath, 'utf-8');
  const title = /Execution Plan[^(]*\(([^)]+)\)/.exec(text)?.[1];
  const complexity = /\*\*(simple|medium|complex)\*\*/i.exec(text)?.[1]?.toLowerCase();

  // Parse DAG table rows: | id | archetype | repo | objective | dependsOn |
  const workers: WorkerState[] = [];
  for (const line of text.split('\n')) {
    const m = /^\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/.exec(line);
    if (!m) continue;
    const id = m[1].trim();
    if (!/^W\d+$/.test(id)) continue;
    const [archetype, repo, objective, deps] = [m[2].trim(), m[3].trim(), m[4].trim(), m[5].trim()];
    workers.push({
      id,
      archetype,
      repository: repo === '—' ? null : repo,
      objective,
      dependsOn: deps && deps !== '—' ? deps.split(',').map((d) => d.trim()) : [],
      status: 'unknown',
    });
  }

  return {
    issueId,
    title,
    complexity,
    status: 'unknown',
    workers,
    fromPlanFallback: true,
  };
}
