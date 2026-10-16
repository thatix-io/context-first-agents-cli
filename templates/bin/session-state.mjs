#!/usr/bin/env node
// Single writer of a session's machine-readable state (.sessions/<ISSUE-ID>/state.json) and of
// its append-only event log (.sessions/<ISSUE-ID>/events.jsonl). Commands call it instead of
// hand-writing JSON, so status/phase/needsHuman/updatedAt and the events always agree.
// Contract: SESSION-STATE.md (v0.15).
//
//   node session-state.mjs <sessionDir> set '<json fields>'          merge fields (issueId, title, complexity, engine, repos, waves, runs, …)
//   node session-state.mjs <sessionDir> status <status> [phase]      planned|awaiting_approval|running|blocked|done|pr_open|merged
//   node session-state.mjs <sessionDir> phase <phase>                refine|plan|execute|pre-pr|pr|merge
//   node session-state.mjs <sessionDir> need <id> <kind> "<reason>" ["<howToResolve>"] ["<ref>"]
//   node session-state.mjs <sessionDir> need-json '<item | [items]>'  (or `-` to read the JSON from stdin)
//   node session-state.mjs <sessionDir> resolve <id> [<id>…] | --all
//   node session-state.mjs <sessionDir> approval                     read-only: is there a usable approval.json?
//   node session-state.mjs <sessionDir> apply-approval               consume approval.json for the pending items
//   node session-state.mjs <sessionDir> show                         print status, phase, needsHuman
//
// `need` upserts by id (keeps the original `since`) and moves the status: any non-approval item
// → blocked; only approval items → awaiting_approval. `resolve` removes items; when none is left
// the caller sets the next status. Every status/phase change appends {"type":"status"}; every
// new/changed item {"type":"needs_human"}; every removal {"type":"resolved"}.
// Writes are atomic (tmp + rename); events are one JSON line each (append-only).

import fs from 'node:fs';
import path from 'node:path';

const STATUSES = ['planned', 'awaiting_approval', 'running', 'blocked', 'done', 'pr_open', 'merged'];
const PHASES = ['refine', 'plan', 'execute', 'pre-pr', 'pr', 'merge'];
const KINDS = ['approval', 'decision', 'access', 'failure'];

const [dirArg, cmd, ...rest] = process.argv.slice(2);
const usage =
  'usage: session-state.mjs <sessionDir> set <json> | status <status> [phase] | phase <phase> | ' +
  'need <id> <kind> <reason> [howToResolve] [ref] | need-json <json|-> | resolve <id…|--all> | approval | apply-approval | show';
const fail = (msg) => {
  console.error(`session-state: ${msg}\n${usage}`);
  process.exit(2);
};
if (!dirArg || !cmd) fail('missing arguments');

const dir = path.resolve(dirArg);
const stateFile = path.join(dir, 'state.json');
const eventsFile = path.join(dir, 'events.jsonl');
const approvalFile = path.join(dir, 'approval.json');
const now = new Date().toISOString();

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
};

let state = readJson(stateFile) ?? {};
if (typeof state !== 'object' || Array.isArray(state)) state = {};
const before = { status: state.status, phase: state.phase };
const events = [];
let dirty = false;

const emit = (e) => events.push({ at: now, ...e });
const items = () => (Array.isArray(state.needsHuman) ? state.needsHuman : []);

function setStatus(status, phase) {
  if (status !== undefined && !STATUSES.includes(status)) fail(`invalid status "${status}" (${STATUSES.join('|')})`);
  if (phase !== undefined && !PHASES.includes(phase)) fail(`invalid phase "${phase}" (${PHASES.join('|')})`);
  if (status !== undefined) state.status = status;
  if (phase !== undefined) state.phase = phase;
  dirty = true;
}

/** Status implied by the pending items (null when nothing is pending). */
function statusFromItems() {
  const list = items();
  if (!list.length) return null;
  return list.some((i) => i.kind !== 'approval') ? 'blocked' : 'awaiting_approval';
}

function upsert(raw) {
  if (!raw || typeof raw !== 'object') fail('needsHuman item must be an object');
  const id = String(raw.id ?? '').trim();
  if (!id) fail('needsHuman item needs an id');
  const kind = KINDS.includes(raw.kind) ? raw.kind : fail(`invalid kind "${raw.kind}" (${KINDS.join('|')})`);
  const list = items();
  const prev = list.find((i) => i.id === id);
  const item = {
    id,
    kind,
    reason: String(raw.reason ?? id),
    since: prev?.since ?? raw.since ?? now,
    howToResolve: raw.howToResolve ?? prev?.howToResolve ?? null,
    ref: raw.ref ?? prev?.ref ?? null,
  };
  state.needsHuman = [...list.filter((i) => i.id !== id), item];
  if (!prev || prev.kind !== item.kind || prev.reason !== item.reason) emit({ type: 'needs_human', item });
  dirty = true;
}

function resolve(ids) {
  const list = items();
  const gone = ids === 'all' ? list : list.filter((i) => ids.includes(i.id));
  if (!gone.length) return [];
  state.needsHuman = list.filter((i) => !gone.includes(i));
  for (const i of gone) emit({ type: 'resolved', id: i.id });
  dirty = true;
  return gone.map((i) => i.id);
}

/** approval.json is usable only if written after every pending item (never a stale answer). */
function readApproval() {
  if (!fs.existsSync(approvalFile)) return { state: 'missing' };
  const a = readJson(approvalFile);
  if (!a || typeof a !== 'object' || typeof a.approved !== 'boolean') {
    return { state: 'invalid', reason: 'approval.json must be { "approved": true|false, "by", "at", "notes" }' };
  }
  const at = Date.parse(a.at ?? '') || fs.statSync(approvalFile).mtimeMs;
  const pending = items();
  // second precision: an approval stamped in the same second as the item still counts
  const newest = Math.floor(Math.max(0, ...pending.map((i) => Date.parse(i.since ?? '') || 0)) / 1000) * 1000;
  const base = { by: a.by ?? null, at: a.at ?? new Date(at).toISOString(), notes: a.notes ?? null };
  if (pending.length && at < newest) {
    return { state: 'stale', ...base, reason: 'approval.json is older than the pending item(s) — write a new one' };
  }
  return { state: a.approved ? 'approved' : 'rejected', ...base };
}

function readInput(arg) {
  const text = arg === '-' || arg === undefined ? fs.readFileSync(0, 'utf-8') : arg;
  try {
    return JSON.parse(text);
  } catch {
    return fail('invalid JSON');
  }
}

const print = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

switch (cmd) {
  case 'set': {
    const patch = readInput(rest[0]);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) fail('set needs a JSON object');
    const { status, phase, needsHuman, updatedAt, ...fields } = patch;
    if (needsHuman !== undefined) fail('use need/resolve to change needsHuman');
    Object.assign(state, fields);
    if (status !== undefined || phase !== undefined) setStatus(status, phase);
    dirty = true;
    break;
  }
  case 'status':
    if (!rest[0]) fail('missing status');
    setStatus(rest[0], rest[1]);
    break;
  case 'phase':
    if (!rest[0]) fail('missing phase');
    setStatus(undefined, rest[0]);
    break;
  case 'need': {
    const [id, kind, reason, howToResolve, ref] = rest;
    if (!id || !kind || !reason) fail('need <id> <kind> <reason> [howToResolve] [ref]');
    upsert({ id, kind, reason, howToResolve, ref });
    setStatus(statusFromItems());
    break;
  }
  case 'need-json': {
    const input = readInput(rest[0]);
    const list = Array.isArray(input) ? input : [input];
    list.forEach(upsert);
    if (list.length) setStatus(statusFromItems());
    break;
  }
  case 'resolve': {
    if (!rest.length) fail('resolve <id…> | --all');
    print({ resolved: resolve(rest[0] === '--all' ? 'all' : rest) });
    break;
  }
  case 'approval':
    print({ ...readApproval(), pending: items().map((i) => i.id) });
    break;
  case 'apply-approval': {
    const a = readApproval();
    if (a.state === 'approved') {
      const resolved = resolve('all');
      state.approval = { approved: true, by: a.by, at: a.at, notes: a.notes };
      dirty = true;
      print({ result: 'approved', resolved, by: a.by, notes: a.notes });
    } else if (a.state === 'rejected') {
      const resolved = resolve('all');
      state.approval = { approved: false, by: a.by, at: a.at, notes: a.notes };
      state.rejected = true;
      state.notes = a.notes;
      setStatus('done');
      print({ result: 'rejected', resolved, by: a.by, notes: a.notes });
    } else {
      // missing / stale / invalid → change nothing; the caller warns and stops.
      print({ result: a.state, reason: a.reason ?? 'no approval.json in the session', pending: items().map((i) => i.id) });
    }
    break;
  }
  case 'show':
    print({ status: state.status ?? null, phase: state.phase ?? null, needsHuman: items(), updatedAt: state.updatedAt ?? null });
    break;
  default:
    fail(`unknown command "${cmd}"`);
}

if (dirty) {
  if (state.status !== before.status || state.phase !== before.phase) {
    // status line first, then the item lines of the same call (same timestamp)
    events.unshift({ at: now, type: 'status', status: state.status ?? null, phase: state.phase ?? null });
  }
  state.createdAt ??= now;
  state.updatedAt = now;
  if (!Array.isArray(state.needsHuman)) state.needsHuman = [];
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${stateFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmp, stateFile);
  if (events.length) fs.appendFileSync(eventsFile, events.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf-8');
}
