import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, tmpDir, writeTree } from './helpers.js';

const CLI = path.join(ROOT, 'src', 'index.ts');
const KEYS = ['issueId', 'legacy', 'needsHuman', 'path', 'phase', 'project', 'status', 'title', 'updatedAt'];

function cfa(args: string[], opts: { cwd?: string; home?: string } = {}) {
  const r = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), CLI, ...args], {
    cwd: opts.cwd ?? ROOT,
    encoding: 'utf-8',
    env: { ...process.env, HOME: opts.home ?? tmpDir('cfa-home-'), FORCE_COLOR: '0' },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function makeOrchestrator(name: string) {
  const dir = path.join(tmpDir(), name);
  writeTree(dir, {
    'context-manifest.json': { version: '1.0', project: name, repositories: [] },
    // v0.15 session waiting for approval
    '.sessions/NEW-1/state.json': {
      issueId: 'NEW-1', title: 'New flow', status: 'awaiting_approval', phase: 'plan', updatedAt: '2026-10-15T20:10:00Z',
      needsHuman: [{ id: 'plan-approval', kind: 'approval', reason: 'Plan ready for approval', since: '2026-10-15T20:10:00Z', howToResolve: 'write approval.json', ref: 'execution-plan.md' }],
    },
    '.sessions/NEW-1/execution-plan.md': '# plan',
    // v0.14 session merged
    '.sessions/OLD-1/state.json': { issueId: 'OLD-1', title: 'Old merged', status: 'merged' },
    '.sessions/OLD-1/pr.md': '# prs',
    // v0.14 session with a blocked worker
    '.sessions/OLD-2/state.json': { issueId: 'OLD-2', title: 'Old blocked', status: 'running' },
    '.sessions/OLD-2/workers/W3.json': { id: 'W3', status: 'blocked', currentStep: 'needs a product decision' },
    // pre-state-json session: title from refined.md
    '.sessions/OLD-3/refined.md': '# OLD-3 — Refined title\n',
    '.sessions/_backlog/ignored.md': 'x',
  });
  return dir;
}

test('status --json --project <dir> → normalized rows (new + inferred legacy sessions)', () => {
  const dir = makeOrchestrator('proj-a');
  const r = cfa(['status', '--json', '--project', dir]);
  assert.equal(r.code, 0, r.err);
  const rows = JSON.parse(r.out);
  assert.deepEqual(rows.map((x: { issueId: string }) => x.issueId), ['NEW-1', 'OLD-1', 'OLD-2', 'OLD-3']);
  for (const row of rows) assert.deepEqual(Object.keys(row).sort(), KEYS);
  const by = Object.fromEntries(rows.map((x: { issueId: string }) => [x.issueId, x]));
  assert.deepEqual([by['NEW-1'].status, by['NEW-1'].phase, by['NEW-1'].legacy], ['awaiting_approval', 'plan', false]);
  assert.equal(by['NEW-1'].needsHuman[0].id, 'plan-approval');
  assert.equal(by['NEW-1'].project, 'proj-a');
  assert.equal(by['NEW-1'].path, path.join(dir, '.sessions', 'NEW-1'));
  assert.deepEqual([by['OLD-1'].status, by['OLD-1'].phase, by['OLD-1'].legacy], ['merged', 'merge', true]);
  assert.deepEqual([by['OLD-2'].status, by['OLD-2'].phase], ['blocked', 'execute']);
  assert.deepEqual(by['OLD-2'].needsHuman.map((n: { id: string; reason: string }) => [n.id, n.reason]), [['W3-blocked', 'needs a product decision']]);
  assert.deepEqual([by['OLD-3'].status, by['OLD-3'].phase, by['OLD-3'].title], ['planned', 'refine', 'Refined title']);
});

test('status --json: repeatable --project, missing dir reported on stderr', () => {
  const a = makeOrchestrator('proj-a');
  const b = makeOrchestrator('proj-b');
  const r = cfa(['status', '--json', '--project', a, '--project', b, '--project', path.join(a, 'nope')]);
  const rows = JSON.parse(r.out);
  assert.deepEqual([...new Set(rows.map((x: { project: string }) => x.project))], ['proj-a', 'proj-b']);
  assert.match(r.err, /not found/);
  assert.equal(r.code, 1);
});

test('status --json without --project: current orchestrator, else dashboard registry projects', () => {
  const a = makeOrchestrator('proj-a');
  const b = makeOrchestrator('proj-b');
  // inside an orchestrator → that orchestrator only
  let rows = JSON.parse(cfa(['status', '--json'], { cwd: a }).out);
  assert.deepEqual([...new Set(rows.map((x: { project: string }) => x.project))], ['proj-a']);
  // outside → registry (~/.context-agents/dashboard.json)
  const home = tmpDir('cfa-home-');
  writeTree(home, {
    '.context-agents/dashboard.json': { port: 0, pid: 0, startedAt: '', projects: [{ name: 'proj-a', path: a, addedAt: '' }, { name: 'proj-b', path: b, addedAt: '' }] },
  });
  const outside = tmpDir('cfa-cwd-');
  rows = JSON.parse(cfa(['status', '--json'], { cwd: outside, home }).out);
  assert.deepEqual([...new Set(rows.map((x: { project: string }) => x.project))], ['proj-a', 'proj-b']);
  // --all inside an orchestrator → registry too
  rows = JSON.parse(cfa(['status', '--json', '--all'], { cwd: a, home }).out);
  assert.equal(new Set(rows.map((x: { project: string }) => x.project)).size, 2);
  // nothing anywhere → []
  assert.deepEqual(JSON.parse(cfa(['status', '--json'], { cwd: outside }).out), []);
});

test('status (human output) shows waiting-on-you items', () => {
  const dir = makeOrchestrator('proj-a');
  const r = cfa(['status'], { cwd: dir });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /NEW-1.*awaiting_approval.*\[plan\]/);
  assert.match(r.out, /waiting on you \(approval\): Plan ready for approval/);
  assert.ok(fs.existsSync(dir));
});
