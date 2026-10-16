import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, readJsonl, tmpDir } from './helpers.js';

const SS = path.join(ROOT, 'templates', 'bin', 'session-state.mjs');
const WS = path.join(ROOT, 'templates', 'bin', 'worker-state.mjs');

function ss(dir: string, args: string[], input?: string) {
  const r = spawnSync(process.execPath, [SS, dir, ...args], { encoding: 'utf-8', input });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim(), json: () => JSON.parse(r.stdout) };
}
const state = (dir: string) => JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf-8'));
const events = (dir: string) => readJsonl(path.join(dir, 'events.jsonl'));

test('session-state: set/status write state.json + status events', () => {
  const dir = path.join(tmpDir(), '.sessions', 'AS-1');
  assert.equal(ss(dir, ['set', '{"issueId":"AS-1","title":"T"}']).code, 0);
  assert.equal(ss(dir, ['status', 'planned', 'plan']).code, 0);
  const st = state(dir);
  assert.equal(st.issueId, 'AS-1');
  assert.equal(st.status, 'planned');
  assert.equal(st.phase, 'plan');
  assert.deepEqual(st.needsHuman, []);
  assert.ok(st.updatedAt && st.createdAt);
  const ev = events(dir);
  assert.equal(ev.length, 1);
  assert.deepEqual({ ...ev[0], at: undefined }, { at: undefined, type: 'status', status: 'planned', phase: 'plan' });
  // same status again → no new event
  ss(dir, ['status', 'planned', 'plan']);
  assert.equal(events(dir).length, 1);
});

test('session-state: rejects invalid vocabulary without writing', () => {
  const dir = path.join(tmpDir(), 'S');
  assert.equal(ss(dir, ['status', 'in_review']).code, 2);
  assert.equal(ss(dir, ['phase', 'deploy']).code, 2);
  assert.equal(ss(dir, ['need', 'x', 'question', 'why']).code, 2);
  assert.equal(ss(dir, ['set', '{"needsHuman":[]}']).code, 2);
  assert.equal(fs.existsSync(path.join(dir, 'state.json')), false);
});

test('session-state: need → awaiting_approval, events in contract order, since stable on upsert', () => {
  const dir = path.join(tmpDir(), 'S');
  ss(dir, ['status', 'planned', 'plan']);
  ss(dir, ['need', 'plan-approval', 'approval', 'Plan ready', 'write approval.json', 'execution-plan.md']);
  let st = state(dir);
  assert.equal(st.status, 'awaiting_approval');
  assert.equal(st.needsHuman.length, 1);
  const item = st.needsHuman[0];
  assert.deepEqual(Object.keys(item).sort(), ['howToResolve', 'id', 'kind', 'reason', 'ref', 'since']);
  assert.equal(item.ref, 'execution-plan.md');
  const ev = events(dir);
  assert.deepEqual(ev.slice(1).map((e) => e.type), ['status', 'needs_human']);
  assert.equal(ev[1].status, 'awaiting_approval');
  assert.equal((ev[2].item as { id: string }).id, 'plan-approval');
  // upsert with the same id keeps since, no duplicate event
  ss(dir, ['need', 'plan-approval', 'approval', 'Plan ready']);
  st = state(dir);
  assert.equal(st.needsHuman.length, 1);
  assert.equal(st.needsHuman[0].since, item.since);
  assert.equal(st.needsHuman[0].ref, 'execution-plan.md');
  assert.equal(events(dir).length, ev.length);
});

test('session-state: need-json from stdin (workflow items), non-approval → blocked, extra fields dropped', () => {
  const dir = path.join(tmpDir(), 'S');
  ss(dir, ['status', 'running', 'execute']);
  const items = [
    { id: 'W3-blocked', kind: 'decision', reason: 'W3: which endpoint?', howToResolve: 'decide', ref: 'workers/W3.md', worker: 'W3', unresolved: ['x'] },
    { id: 'spawn-W1-migration', kind: 'approval', reason: 'proposal', ref: 'workers/W1.md' },
  ];
  const r = ss(dir, ['need-json', '-'], JSON.stringify(items));
  assert.equal(r.code, 0, r.err);
  const st = state(dir);
  assert.equal(st.status, 'blocked');
  assert.deepEqual(st.needsHuman.map((i: { id: string }) => i.id), ['W3-blocked', 'spawn-W1-migration']);
  assert.equal('worker' in st.needsHuman[0], false);
  assert.equal(events(dir).filter((e) => e.type === 'needs_human').length, 2);
});

test('session-state: resolve emits resolved events', () => {
  const dir = path.join(tmpDir(), 'S');
  ss(dir, ['need', 'a', 'failure', 'boom']);
  ss(dir, ['need', 'b', 'access', 'creds']);
  assert.deepEqual(ss(dir, ['resolve', 'a']).json(), { resolved: ['a'] });
  assert.deepEqual(ss(dir, ['resolve', '--all']).json(), { resolved: ['b'] });
  assert.deepEqual(state(dir).needsHuman, []);
  assert.deepEqual(events(dir).filter((e) => e.type === 'resolved').map((e) => e.id), ['a', 'b']);
});

test('session-state: approval missing / stale / approved / rejected', () => {
  const dir = path.join(tmpDir(), 'S');
  ss(dir, ['status', 'planned', 'plan']);
  ss(dir, ['need', 'plan-approval', 'approval', 'Plan ready']);
  // missing → nothing changes
  assert.equal(ss(dir, ['apply-approval']).json().result, 'missing');
  assert.equal(state(dir).needsHuman.length, 1);
  // stale (older than the pending item)
  fs.writeFileSync(path.join(dir, 'approval.json'), JSON.stringify({ approved: true, by: 'ci', at: '2000-01-01T00:00:00Z' }));
  assert.equal(ss(dir, ['approval']).json().state, 'stale');
  assert.equal(ss(dir, ['apply-approval']).json().result, 'stale');
  assert.equal(state(dir).needsHuman.length, 1);
  // invalid
  fs.writeFileSync(path.join(dir, 'approval.json'), '{"ok":1}');
  assert.equal(ss(dir, ['apply-approval']).json().result, 'invalid');
  // approved → resolves, records approval, status left for the caller
  const at = new Date(Date.now() + 1000).toISOString();
  fs.writeFileSync(path.join(dir, 'approval.json'), JSON.stringify({ approved: true, by: 'Jane', at, notes: 'ok' }));
  const r = ss(dir, ['apply-approval']).json();
  assert.deepEqual(r, { result: 'approved', resolved: ['plan-approval'], by: 'Jane', notes: 'ok' });
  const st = state(dir);
  assert.deepEqual(st.needsHuman, []);
  assert.deepEqual(st.approval, { approved: true, by: 'Jane', at, notes: 'ok' });
  assert.equal(events(dir).at(-1)!.type, 'resolved');

  // rejected → done + rejected + notes
  const dir2 = path.join(tmpDir(), 'S');
  ss(dir2, ['status', 'planned', 'plan']);
  ss(dir2, ['need', 'plan-approval', 'approval', 'Plan ready']);
  fs.writeFileSync(path.join(dir2, 'approval.json'), JSON.stringify({ approved: false, by: 'Jane', at: new Date(Date.now() + 1000).toISOString(), notes: 'too risky' }));
  assert.equal(ss(dir2, ['apply-approval']).json().result, 'rejected');
  const st2 = state(dir2);
  assert.equal(st2.status, 'done');
  assert.equal(st2.phase, 'plan');
  assert.equal(st2.rejected, true);
  assert.equal(st2.notes, 'too risky');
  assert.deepEqual(st2.needsHuman, []);
  const ev2 = events(dir2);
  assert.deepEqual(ev2.slice(-2).map((e) => e.type), ['status', 'resolved']);
  assert.equal(ev2.at(-2)!.status, 'done');
});

test('session-state: keeps fields written by older templates (merge into existing state.json)', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ issueId: 'OLD-1', status: 'in_review', waves: [['W1']], pullRequests: [1] }));
  ss(dir, ['status', 'pr_open', 'pr']);
  const st = state(dir);
  assert.deepEqual(st.waves, [['W1']]);
  assert.deepEqual(st.pullRequests, [1]);
  assert.equal(st.status, 'pr_open');
});

test('worker-state: finish blocked with reason → blockedReason + step; done clears it', () => {
  const file = path.join(tmpDir(), 'workers', 'W3.json');
  const run = (...args: string[]) => spawnSync(process.execPath, [WS, file, ...args], { encoding: 'utf-8' }).status;
  assert.equal(run('start', '{"id":"W3","name":"impl:x"}', 'reading spec'), 0);
  assert.equal(run('finish', 'blocked', '', 'needs the prod API key'), 0);
  let w = JSON.parse(fs.readFileSync(file, 'utf-8'));
  assert.equal(w.status, 'blocked');
  assert.equal(w.verdict, null);
  assert.equal(w.blockedReason, 'needs the prod API key');
  assert.equal(w.currentStep, 'blocked: needs the prod API key');
  // backward compatible: finish without a reason still works
  assert.equal(run('finish', 'done', 'PASS'), 0);
  w = JSON.parse(fs.readFileSync(file, 'utf-8'));
  assert.equal(w.status, 'done');
  assert.equal(w.verdict, 'PASS');
  assert.equal(w.blockedReason, null);
});
