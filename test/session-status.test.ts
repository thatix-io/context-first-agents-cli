import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  normalizeSession,
  readSessionStatus,
  type SessionSnapshot,
} from '../src/core/session-status.js';
import { tmpDir, writeTree } from './helpers.js';

const snap = (over: Partial<SessionSnapshot>): SessionSnapshot => ({
  issueId: 'X-1',
  state: null,
  workers: [],
  files: [],
  newestMtime: '2026-01-01T00:00:00.000Z',
  ...over,
});

test('v0.15 state.json is trusted as-is (legacy: false)', () => {
  const n = normalizeSession(
    snap({
      state: {
        status: 'awaiting_approval',
        phase: 'plan',
        updatedAt: '2026-10-15T20:10:00Z',
        needsHuman: [{ id: 'plan-approval', kind: 'approval', reason: 'Plan ready', since: '2026-10-15T20:10:00Z', howToResolve: 'approve', ref: 'execution-plan.md' }],
      },
      // stale worker files must not override a contract state
      workers: [{ id: 'W1', status: 'blocked' }],
      files: ['state.json', 'execution-plan.md'],
    })
  );
  assert.equal(n.legacy, false);
  assert.equal(n.status, 'awaiting_approval');
  assert.equal(n.phase, 'plan');
  assert.equal(n.updatedAt, '2026-10-15T20:10:00Z');
  assert.deepEqual(n.needsHuman, [
    { id: 'plan-approval', kind: 'approval', reason: 'Plan ready', since: '2026-10-15T20:10:00Z', howToResolve: 'approve', ref: 'execution-plan.md' },
  ]);
});

test('legacy: merged status → merged/merge, stale blocked worker ignored', () => {
  const n = normalizeSession(
    snap({ state: { status: 'merged' }, workers: [{ id: 'W2', status: 'blocked' }], files: ['state.json', 'pr.md', 'pre-pr-report.md'] })
  );
  assert.deepEqual([n.status, n.phase, n.legacy, n.needsHuman.length], ['merged', 'merge', true, 0]);
});

test('legacy: mergedAt / merged / merge keys are merge evidence', () => {
  for (const extra of [{ mergedAt: '2026-09-15T23:06:34Z' }, { merged: { at: 'x' } }, { merge: { strategy: 'squash' } }]) {
    const n = normalizeSession(snap({ state: { status: 'done', ...extra }, files: ['state.json', 'pr.md'] }));
    assert.equal(n.phase, 'merge');
    assert.equal(n.status, 'merged');
  }
});

test('legacy: in_review → pr_open, pullRequests → pr phase', () => {
  const n = normalizeSession(snap({ state: { status: 'in_review', pullRequests: [{ id: 1 }] }, files: ['state.json', 'pr.md'] }));
  assert.deepEqual([n.status, n.phase], ['pr_open', 'pr']);
});

test('legacy: done + pr.md (no merge evidence) → pr_open', () => {
  const n = normalizeSession(snap({ state: { status: 'done' }, workers: [{ id: 'W1', status: 'done' }], files: ['state.json', 'pr.md'] }));
  assert.deepEqual([n.status, n.phase], ['pr_open', 'pr']);
});

test('legacy: executable-complete → done', () => {
  const n = normalizeSession(snap({ state: { status: 'executable-complete' }, workers: [{ id: 'W1', status: 'done' }], files: ['state.json', 'prd.md'] }));
  assert.deepEqual([n.status, n.phase], ['done', 'execute']);
});

test('legacy: pre-pr-report.md → pre-pr phase', () => {
  const n = normalizeSession(snap({ state: { status: 'done' }, workers: [{ id: 'W1', status: 'done' }], files: ['state.json', 'pre-pr-report.md'] }));
  assert.deepEqual([n.status, n.phase], ['done', 'pre-pr']);
});

test('legacy: blocked worker → blocked + needsHuman <Wid>-blocked (decision, reason = blockedReason/currentStep)', () => {
  const n = normalizeSession(
    snap({
      state: { status: 'running', updatedAt: '2026-09-18T12:00:00Z' },
      workers: [
        { id: 'W1', status: 'done' },
        { id: 'W3', status: 'blocked', currentStep: 'waiting for the PO to validate the copy', finishedAt: '2026-09-18T12:37:07Z' },
        { id: 'W4', status: 'running' },
      ],
      files: ['state.json', 'execution-plan.md'],
      workerReports: ['W3.md'],
    })
  );
  assert.equal(n.status, 'blocked');
  assert.equal(n.phase, 'execute');
  assert.deepEqual(n.needsHuman, [
    {
      id: 'W3-blocked',
      kind: 'decision',
      reason: 'waiting for the PO to validate the copy',
      since: '2026-09-18T12:37:07Z',
      howToResolve: 'Read the worker report, decide, then run /orchestrate X-1 --resume',
      ref: 'workers/W3.md',
    },
  ]);
  const withReason = normalizeSession(snap({ workers: [{ id: 'W9', status: 'blocked', blockedReason: 'needs prod creds', currentStep: 'x' }] }));
  assert.equal(withReason.needsHuman[0].reason, 'needs prod creds');
  assert.equal(withReason.needsHuman[0].ref, 'workers/W9.json');
});

test('legacy: running worker → running (live work wins over a stale "done")', () => {
  const n = normalizeSession(snap({ state: { status: 'done' }, workers: [{ id: 'W1', status: 'running' }], files: ['state.json'] }));
  assert.deepEqual([n.status, n.phase], ['running', 'execute']);
});

test('legacy: plan without started workers → planned/plan; planner done does not count as execute', () => {
  const n = normalizeSession(
    snap({ state: { status: 'planned' }, workers: [{ id: 'W0', archetype: 'planner', status: 'done' }, { id: 'W1', status: 'pending' }], files: ['state.json', 'execution-plan.md'] })
  );
  assert.deepEqual([n.status, n.phase], ['planned', 'plan']);
});

test('legacy: only prd.md / refined.md → planned/refine; updatedAt falls back to mtime', () => {
  const n = normalizeSession(snap({ files: ['prd.md', 'refined.md'] }));
  assert.deepEqual([n.status, n.phase, n.updatedAt], ['planned', 'refine', '2026-01-01T00:00:00.000Z']);
});

test('legacy: old flow plan.md + pr.md (no state.json) → pr_open/pr', () => {
  const n = normalizeSession(snap({ files: ['plan.md', 'pr.md', 'pre-pr-report.md', 'refined.md'] }));
  assert.deepEqual([n.status, n.phase], ['pr_open', 'pr']);
});

test('invalid needsHuman entries are dropped, unknown kinds normalized', () => {
  const n = normalizeSession(
    snap({ state: { status: 'blocked', phase: 'execute', needsHuman: [null, { reason: 'no id' }, { id: 'a', kind: 'weird' }] } })
  );
  assert.deepEqual(n.needsHuman, [{ id: 'a', kind: 'decision', reason: 'a', since: null, howToResolve: null, ref: null }]);
});

test('readSessionStatus reads a session directory from disk', async () => {
  const dir = tmpDir();
  const sdir = path.join(dir, '.sessions', 'AB-1');
  writeTree(sdir, {
    'state.json': { issueId: 'AB-1', status: 'done', mergedAt: '2026-09-15T23:06:34.375Z' },
    'workers/W1.json': { id: 'W1', status: 'done' },
    'workers/W1.md': '# report',
    'pr.md': '# PRs',
  });
  const n = await readSessionStatus(sdir, 'AB-1');
  assert.equal(n.status, 'merged');
  assert.equal(n.phase, 'merge');
  assert.equal(n.legacy, true);
  assert.ok(n.updatedAt && !Number.isNaN(Date.parse(n.updatedAt)));
});
