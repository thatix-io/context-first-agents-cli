import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { readSession } from '../src/core/sessions.js';
import { ROOT, tmpDir, writeTree } from './helpers.js';

function orchestrator() {
  const dir = path.join(tmpDir(), 'proj-d');
  writeTree(dir, {
    'context-manifest.json': { version: '1.0', project: 'proj-d', repositories: [] },
    '.sessions/NEW-1/state.json': {
      issueId: 'NEW-1', status: 'awaiting_approval', phase: 'plan', updatedAt: '2026-10-15T20:10:00Z',
      needsHuman: [{ id: 'plan-approval', kind: 'approval', reason: 'Plan ready for approval', since: '2026-10-15T20:10:00Z', howToResolve: 'x', ref: 'execution-plan.md' }],
    },
    '.sessions/OLD-1/state.json': { issueId: 'OLD-1', status: 'in_review', waves: [['W1']] },
    '.sessions/OLD-1/workers/W1.json': { id: 'W1', status: 'done' },
  });
  return dir;
}

test('readSession exposes normalized status, phase and needsHuman (dashboard data)', async () => {
  const dir = orchestrator();
  const s = await readSession(dir, 'NEW-1');
  assert.deepEqual([s.status, s.phase, s.legacy, s.needsHuman?.[0]?.id], ['awaiting_approval', 'plan', false, 'plan-approval']);
  const old = await readSession(dir, 'OLD-1');
  assert.deepEqual([old.status, old.phase, old.legacy, old.workers.length], ['pr_open', 'pr', true, 1]);
});

test('dashboard /api/map and /api/projects report sessions waiting on a human', async () => {
  const dir = orchestrator();
  const home = tmpDir('cfa-home-');
  const port = 40000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(ROOT, 'src', 'index.ts'), 'dashboard', '--no-open', '--port', String(port)], {
    cwd: dir,
    env: { ...process.env, HOME: home },
    stdio: 'ignore',
  });
  try {
    let map: any = null;
    for (let i = 0; i < 50 && !map; i++) {
      await new Promise((r) => setTimeout(r, 100));
      map = await fetch(`http://127.0.0.1:${port}/api/map`).then((r) => r.json()).catch(() => null);
    }
    assert.ok(map, 'dashboard did not start');
    const proj = map.projects.find((p: { name: string }) => p.name === 'proj-d');
    assert.equal(proj.waiting, 1);
    const s = proj.sessions.find((x: { issueId: string }) => x.issueId === 'NEW-1');
    assert.equal(s.status, 'awaiting_approval');
    assert.equal(s.phase, 'plan');
    assert.equal(s.needsHuman[0].reason, 'Plan ready for approval');
    const projects = await fetch(`http://127.0.0.1:${port}/api/projects`).then((r) => r.json());
    assert.equal(projects.projects[0].waiting, 1);
    const html = await fetch(`http://127.0.0.1:${port}/`).then((r) => r.text());
    assert.match(html, /waiting on you/);
  } finally {
    child.kill('SIGTERM');
  }
});
