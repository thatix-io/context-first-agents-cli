import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Machine-readable session contract (v0.15) — see templates/orchestrator/SESSION-STATE.md.
 *
 * Sessions written by v0.15+ commands carry `status`, `phase`, `needsHuman[]` and `updatedAt`
 * in `state.json`. Older sessions (v0.14 and earlier, or hand-edited ones) are still valid:
 * their status/phase/needsHuman are INFERRED from the files present in the session dir.
 * This module is the single implementation of that inference, shared by `status --json`
 * and the dashboard.
 */

export const SESSION_STATUSES = [
  'planned',
  'awaiting_approval',
  'running',
  'blocked',
  'done',
  'pr_open',
  'merged',
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_PHASES = ['refine', 'plan', 'execute', 'pre-pr', 'pr', 'merge'] as const;
export type SessionPhase = (typeof SESSION_PHASES)[number];

export const NEEDS_HUMAN_KINDS = ['approval', 'decision', 'access', 'failure'] as const;
export type NeedsHumanKind = (typeof NEEDS_HUMAN_KINDS)[number];

export interface NeedsHumanItem {
  /** Stable while the pending item exists (plan-approval, W3-blocked, conflict-<repo>, …). */
  id: string;
  kind: NeedsHumanKind;
  reason: string;
  since: string | null;
  howToResolve: string | null;
  /** Session file holding the detail (relative to the session dir). */
  ref: string | null;
}

/** Minimal worker shape the inference needs (workers/<id>.json). */
export interface WorkerSnapshot {
  id: string;
  archetype?: string;
  status?: string;
  currentStep?: string | null;
  verdict?: string | null;
  blockedReason?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

/** Everything the inference looks at, already read from disk (pure input → testable). */
export interface SessionSnapshot {
  issueId: string;
  /** Parsed state.json, or null when absent/invalid. */
  state: Record<string, unknown> | null;
  workers: WorkerSnapshot[];
  /** Names of the entries at the top level of the session dir (files and dirs). */
  files: string[];
  /** Newest mtime (ISO) among the session's state files, used when updatedAt is missing. */
  newestMtime?: string | null;
  /** Name of the report file for a worker, if it exists (workers/<id>.md). */
  workerReports?: string[];
}

export interface NormalizedSession {
  status: SessionStatus;
  phase: SessionPhase;
  needsHuman: NeedsHumanItem[];
  updatedAt: string | null;
  /** true when status/phase were inferred (state.json does not follow the v0.15 contract). */
  legacy: boolean;
}

/** One row of `status --json`. */
export interface SessionStatusEntry extends NormalizedSession {
  project: string;
  issueId: string;
  title: string | null;
  path: string;
}

const isStatus = (v: unknown): v is SessionStatus =>
  typeof v === 'string' && (SESSION_STATUSES as readonly string[]).includes(v);
const isPhase = (v: unknown): v is SessionPhase =>
  typeof v === 'string' && (SESSION_PHASES as readonly string[]).includes(v);
const isKind = (v: unknown): v is NeedsHumanKind =>
  typeof v === 'string' && (NEEDS_HUMAN_KINDS as readonly string[]).includes(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const truthy = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== false && v !== '' && !(Array.isArray(v) && v.length === 0);

/** Statuses written by older templates / by hand, mapped onto the v0.15 vocabulary. */
const LEGACY_STATUS: Record<string, SessionStatus> = {
  planned: 'planned',
  pending: 'planned',
  awaiting_approval: 'awaiting_approval',
  running: 'running',
  in_progress: 'running',
  blocked: 'blocked',
  done: 'done',
  complete: 'done',
  completed: 'done',
  'executable-complete': 'done',
  in_review: 'pr_open',
  pr_open: 'pr_open',
  merged: 'merged',
};

/** Normalize one needsHuman entry coming from a v0.15 state.json (lenient on input). */
function normalizeItem(raw: unknown): NeedsHumanItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  if (!id) return null;
  return {
    id,
    kind: isKind(r.kind) ? r.kind : 'decision',
    reason: str(r.reason) ?? id,
    since: str(r.since),
    howToResolve: str(r.howToResolve),
    ref: str(r.ref),
  };
}

/** A session follows the v0.15 contract when state.json declares a valid status AND phase. */
export function isContractState(state: Record<string, unknown> | null): boolean {
  return !!state && isStatus(state.status) && isPhase(state.phase);
}

/**
 * Phase inferred from the files present — the most advanced evidence wins:
 *   merged/merge evidence → merge · PR evidence (pr.md, prs) → pr · pre-pr-report.md → pre-pr ·
 *   workers running/finished → execute · execution-plan.md (no worker started) → plan ·
 *   prd.md / refined.md (or nothing) → refine.
 */
export function inferPhase(snap: SessionSnapshot): SessionPhase {
  const s = snap.state ?? {};
  const has = (name: string) => snap.files.includes(name);
  const hasPrefix = (prefix: string) => snap.files.some((f) => f.startsWith(prefix));
  const declared = typeof s.status === 'string' ? s.status : '';

  if (declared === 'merged' || truthy(s.merged) || truthy(s.mergedAt) || truthy(s.merge) || hasPrefix('merged')) {
    return 'merge';
  }
  if (
    declared === 'in_review' ||
    declared === 'pr_open' ||
    truthy(s.prs) ||
    truthy(s.pullRequests) ||
    truthy(s.prNumber) ||
    has('pr.md') ||
    has('prs')
  ) {
    return 'pr';
  }
  if (has('pre-pr-report.md') || truthy(s.prePr)) return 'pre-pr';
  const executing = snap.workers.some(
    (w) => w.archetype !== 'planner' && (w.status === 'running' || w.status === 'done' || w.status === 'blocked')
  );
  if (executing) return 'execute';
  if (has('execution-plan.md') || has('plan.md') || snap.state) return 'plan';
  return 'refine';
}

/** Legacy status: worker blocked → blocked · worker running → running · merged → merged ·
 * in_review → pr_open · executable-complete → done; otherwise mapped/derived from the phase. */
export function inferStatus(snap: SessionSnapshot, phase: SessionPhase): SessionStatus {
  const s = snap.state ?? {};
  const declared = typeof s.status === 'string' ? s.status : '';
  // A completed merge is terminal: stale worker files must not reopen it.
  if (phase === 'merge') return 'merged';
  if (snap.workers.some((w) => w.status === 'blocked')) return 'blocked';
  if (snap.workers.some((w) => w.status === 'running')) return 'running';

  const mapped = LEGACY_STATUS[declared];
  if (mapped) {
    // Older flows kept "done" after opening the PR: the PR evidence is more precise.
    if (mapped === 'done' && phase === 'pr') return 'pr_open';
    return mapped;
  }
  // No usable declared status: derive from the phase and the workers.
  if (phase === 'pr') return 'pr_open';
  if (phase === 'pre-pr') return 'done';
  if (phase === 'execute') {
    const real = snap.workers.filter((w) => w.archetype !== 'planner');
    return real.length && real.every((w) => w.status === 'done') ? 'done' : 'running';
  }
  return 'planned';
}

/** needsHuman for legacy sessions: one `decision` per blocked worker. */
export function inferNeedsHuman(snap: SessionSnapshot, status: SessionStatus): NeedsHumanItem[] {
  if (status === 'merged') return [];
  const reports = new Set(snap.workerReports ?? []);
  return snap.workers
    .filter((w) => w.status === 'blocked')
    .map((w) => ({
      id: `${w.id}-blocked`,
      kind: 'decision' as const,
      reason: str(w.blockedReason) ?? str(w.currentStep) ?? str(w.verdict) ?? `worker ${w.id} is blocked`,
      since: str(w.finishedAt) ?? str(snap.state?.updatedAt) ?? snap.newestMtime ?? null,
      howToResolve: `Read the worker report, decide, then run /orchestrate ${snap.issueId} --resume`,
      ref: reports.has(`${w.id}.md`) ? `workers/${w.id}.md` : `workers/${w.id}.json`,
    }));
}

/** Normalize a session: trust a v0.15 state.json, infer everything for legacy ones. */
export function normalizeSession(snap: SessionSnapshot): NormalizedSession {
  const s = snap.state;
  const updatedAt = str(s?.updatedAt) ?? snap.newestMtime ?? null;
  if (s && isContractState(s)) {
    const raw = Array.isArray(s.needsHuman) ? s.needsHuman : [];
    return {
      status: s.status as SessionStatus,
      phase: s.phase as SessionPhase,
      needsHuman: raw.map(normalizeItem).filter((x): x is NeedsHumanItem => !!x),
      updatedAt,
      legacy: false,
    };
  }
  const phase = inferPhase(snap);
  const status = inferStatus(snap, phase);
  return { status, phase, needsHuman: inferNeedsHuman(snap, status), updatedAt, legacy: true };
}

// ─── Disk loading ───────────────────────────────────────────────────────────────────────────

async function readJson(file: string): Promise<Record<string, unknown> | null> {
  try {
    const v = JSON.parse(await fs.readFile(file, 'utf-8'));
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function mtimeOf(file: string): Promise<string | null> {
  try {
    return (await fs.stat(file)).mtime.toISOString();
  } catch {
    return null;
  }
}

/** Read the files the inference needs from `.sessions/<issueId>/`. */
export async function loadSnapshot(sessionDir: string, issueId: string): Promise<SessionSnapshot> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(sessionDir)).filter((f) => !f.startsWith('.'));
  } catch {
    /* missing dir → empty snapshot */
  }
  const state = await readJson(path.join(sessionDir, 'state.json'));
  const workers: WorkerSnapshot[] = [];
  const workerReports: string[] = [];
  const mtimes: Array<string | null> = [
    await mtimeOf(path.join(sessionDir, 'state.json')),
    await mtimeOf(path.join(sessionDir, 'events.jsonl')),
  ];
  const workersDir = path.join(sessionDir, 'workers');
  let workerFiles: string[] = [];
  try {
    workerFiles = (await fs.readdir(workersDir)).sort();
  } catch {
    /* no workers yet */
  }
  for (const f of workerFiles) {
    if (f.endsWith('.md')) workerReports.push(f);
    if (!f.endsWith('.json')) continue;
    const w = await readJson(path.join(workersDir, f));
    if (!w || typeof w.id !== 'string') continue;
    workers.push(w as unknown as WorkerSnapshot);
    mtimes.push(await mtimeOf(path.join(workersDir, f)));
  }
  if (!state && !workers.length) {
    // Old-flow session: the newest top-level artifact tells when it last moved.
    for (const f of files) if (f.endsWith('.md')) mtimes.push(await mtimeOf(path.join(sessionDir, f)));
  }
  const newestMtime = mtimes.filter((m): m is string => !!m).sort().pop() ?? null;
  return { issueId, state, workers, files, newestMtime, workerReports };
}

/** Normalized status of one session directory. */
export async function readSessionStatus(sessionDir: string, issueId: string): Promise<NormalizedSession> {
  return normalizeSession(await loadSnapshot(sessionDir, issueId));
}
