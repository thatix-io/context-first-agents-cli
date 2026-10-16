#!/usr/bin/env node
// Writes a worker's live state file (.sessions/<ISSUE-ID>/workers/<id>.json, read by the
// dashboard) in one short command, so agents don't spend turns reading/rewriting JSON.
//
//   node worker-state.mjs <file> start '<meta json>' "<first step>"
//   node worker-state.mjs <file> step "<what you are doing now>"
//   node worker-state.mjs <file> finish <done|blocked> [VERDICT] ["<why blocked>"]
//
// `start` merges <meta> (id, name, archetype, repository, dependsOn, objective) over any
// existing file, so a `pending` file written by the orchestrator keeps its fields.
// Writes are atomic (tmp + rename): the dashboard never reads a half-written file.
// `finish blocked` takes an optional one-line reason (stored as `blockedReason` and as the last
// step) — it becomes the `reason` of the session's needsHuman item for this worker.
// Workers never write state.json: the orchestrator (session-state.mjs) is its only writer.

import fs from 'node:fs';
import path from 'node:path';

const [file, cmd, a, b, c] = process.argv.slice(2);
const usage = 'usage: worker-state.mjs <file> start <meta-json> [step] | step <text> | finish <done|blocked> [verdict] [reason]';
const fail = (msg) => {
  console.error(`worker-state: ${msg}\n${usage}`);
  process.exit(2);
};
if (!file || !cmd) fail('missing arguments');

const now = new Date().toISOString();
let state = {};
try {
  state = JSON.parse(fs.readFileSync(file, 'utf-8'));
} catch {
  /* new file */
}
const addStep = (text) => {
  state.currentStep = text;
  state.steps = [...(state.steps ?? []), { step: text, at: now }];
};

if (cmd === 'start') {
  let meta = {};
  try {
    meta = a ? JSON.parse(a) : {};
  } catch {
    fail('invalid meta JSON');
  }
  state = { ...state, ...meta, status: 'running', startedAt: now, finishedAt: null, verdict: null, steps: [] };
  if (b) addStep(b);
} else if (cmd === 'step') {
  if (!a) fail('missing step text');
  addStep(a);
} else if (cmd === 'finish') {
  if (a !== 'done' && a !== 'blocked') fail('finish needs done|blocked');
  state.status = a;
  state.finishedAt = now;
  state.verdict = b || null;
  if (a === 'blocked' && c) {
    state.blockedReason = c;
    addStep(`blocked: ${c}`);
  } else if (a === 'done') {
    state.blockedReason = null;
  }
} else {
  fail(`unknown command "${cmd}"`);
}

fs.mkdirSync(path.dirname(file), { recursive: true });
const tmp = `${file}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
fs.renameSync(tmp, file);
