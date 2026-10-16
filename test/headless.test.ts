import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, readJsonl, tmpDir, writeTree } from './helpers.js';
import { installCommands } from '../src/core/install-commands.js';

const SS = path.join(ROOT, 'templates', 'bin', 'session-state.mjs');
const RESULT_KEYS = ['at', 'command', 'issueId', 'needsHuman', 'phase', 'status'];
const KINDS = ['approval', 'decision', 'access', 'failure'];

function ss(args: string[], opts: { cwd?: string; input?: string } = {}) {
  const r = spawnSync(process.execPath, [SS, ...args], { encoding: 'utf-8', cwd: opts.cwd, input: opts.input });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'));

// ---------------------------------------------------------------- `result` subcommand

test('result: session form reads state.json, writes the contract shape, never touches the session', () => {
  const root = tmpDir();
  const dir = path.join(root, '.sessions', 'R-1');
  ss([dir, 'set', '{"issueId":"R-1","title":"T"}']);
  ss([dir, 'status', 'planned', 'plan']);
  ss([dir, 'need', 'plan-approval', 'approval', 'Plan ready', 'write approval.json', 'execution-plan.md']);
  const stateBefore = fs.readFileSync(path.join(dir, 'state.json'), 'utf-8');
  const eventsBefore = fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf-8');

  const r = ss([dir, 'result', 'out/nested/result.json', 'orchestrate'], { cwd: root });
  assert.equal(r.code, 0, r.err);
  const file = path.join(root, 'out', 'nested', 'result.json'); // relative to the cwd, dirs created
  const res = readJson(file);
  assert.deepEqual(Object.keys(res).sort(), RESULT_KEYS);
  assert.equal(res.command, 'orchestrate');
  assert.equal(res.issueId, 'R-1');
  assert.equal(res.status, 'awaiting_approval');
  assert.equal(res.phase, 'plan');
  assert.deepEqual(res.needsHuman.map((i: { id: string }) => i.id), ['plan-approval']);
  assert.ok(!Number.isNaN(Date.parse(res.at)));
  assert.equal(fs.realpathSync(JSON.parse(r.out).written), fs.realpathSync(file));
  // read-only on the session
  assert.equal(fs.readFileSync(path.join(dir, 'state.json'), 'utf-8'), stateBefore);
  assert.equal(fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf-8'), eventsBefore);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['result.json']); // no tmp file left
});

test('result: absolute path, overwritten on every run', () => {
  const root = tmpDir();
  const dir = path.join(root, '.sessions', 'R-2');
  const file = path.join(root, 'abs.json');
  ss([dir, 'set', '{"issueId":"R-2"}']);
  ss([dir, 'status', 'running', 'pre-pr']);
  ss([dir, 'result', file, 'engineer:pre-pr']);
  assert.equal(readJson(file).status, 'running');
  ss([dir, 'status', 'done', 'pre-pr']);
  ss([dir, 'result', file, 'engineer:pre-pr']);
  const res = readJson(file);
  assert.equal(res.status, 'done');
  assert.equal(res.phase, 'pre-pr');
  assert.deepEqual(res.needsHuman, []);
});

test('result: sessionless form (no session) — issueId/phase null, status from the items', () => {
  const root = tmpDir();
  const r = ss(
    ['result', 'collect.json', 'products:collect', '--need', 'collect-input', 'decision', 'Too vague', '(a) x (b) y — re-run /collect'],
    { cwd: root }
  );
  assert.equal(r.code, 0, r.err);
  const res = readJson(path.join(root, 'collect.json'));
  assert.deepEqual(Object.keys(res).sort(), RESULT_KEYS);
  assert.equal(res.command, 'products:collect');
  assert.equal(res.issueId, null);
  assert.equal(res.phase, null);
  assert.equal(res.status, 'blocked');
  assert.equal(res.needsHuman.length, 1);
  assert.deepEqual(Object.keys(res.needsHuman[0]).sort(), ['howToResolve', 'id', 'kind', 'reason', 'ref', 'since']);
  assert.equal(res.needsHuman[0].howToResolve, '(a) x (b) y — re-run /collect');
  assert.equal(res.needsHuman[0].ref, null);
  assert.deepEqual(fs.readdirSync(root), ['collect.json']); // nothing else created (no .sessions)
});

test('result: --need-json from stdin, approval-only items → awaiting_approval, overrides win', () => {
  const root = tmpDir();
  const items = [{ id: 'a', kind: 'approval', reason: 'ok?', extra: 1 }];
  let r = ss(['result', 'r.json', 'x', '--need-json', '-'], { cwd: root, input: JSON.stringify(items) });
  assert.equal(r.code, 0, r.err);
  let res = readJson(path.join(root, 'r.json'));
  assert.equal(res.status, 'awaiting_approval');
  assert.equal('extra' in res.needsHuman[0], false);

  r = ss(['result', 'r.json', 'x', '--issue', 'I-9', '--status', 'done', '--phase', 'refine'], { cwd: root });
  assert.equal(r.code, 0, r.err);
  res = readJson(path.join(root, 'r.json'));
  assert.deepEqual([res.issueId, res.status, res.phase, res.needsHuman], ['I-9', 'done', 'refine', []]);
});

test('result: an extra item replaces the session item with the same id; old sessions get issueId from the dir', () => {
  const root = tmpDir();
  const dir = path.join(root, '.sessions', 'OLD-7');
  writeTree(dir, { 'state.json': { status: 'running', phase: 'execute' } }); // no issueId (pre-0.15 style)
  const r = ss([dir, 'result', 'r.json', 'orchestrate', '--need', 'orchestrate-failed', 'failure', 'crashed'], { cwd: root });
  assert.equal(r.code, 0, r.err);
  const res = readJson(path.join(root, 'r.json'));
  assert.equal(res.issueId, 'OLD-7');
  assert.equal(res.status, 'blocked'); // a finished run never reports running when it adds a failure
  assert.equal(res.phase, 'execute');
  assert.deepEqual(res.needsHuman.map((i: { id: string }) => i.id), ['orchestrate-failed']);
});

test('result: invalid input exits 2 and writes nothing', () => {
  const root = tmpDir();
  const bad = [
    ['result'],
    ['result', 'r.json'],
    ['result', 'r.json', '--issue', 'X'],
    ['result', 'r.json', 'c', '--status', 'failed'],
    ['result', 'r.json', 'c', '--phase', 'collect'],
    ['result', 'r.json', 'c', '--need', 'id', 'question', 'why'],
    ['result', 'r.json', 'c', '--need', 'id', 'decision'],
    ['result', 'r.json', 'c', '--bogus'],
    ['result', 'r.json', 'c', '--need-json', '{not json'],
  ];
  for (const args of bad) assert.equal(ss(args, { cwd: root }).code, 2, args.join(' '));
  assert.deepEqual(fs.readdirSync(root), []);
});

// ---------------------------------------------------------------- `/collect --headless` with the helper only

test('collect --headless flow (helper only): issue created → session planned·refine → result with the issue id', () => {
  const root = tmpDir(); // the orchestrator directory (cwd of the command)
  const D = path.join('.sessions', 'NEW-12');
  // what the command does after the tracker returned NEW-12
  assert.equal(ss([D, 'set', '{"issueId":"NEW-12","title":"Export orders as CSV"}'], { cwd: root }).code, 0);
  assert.equal(ss([D, 'status', 'planned', 'refine'], { cwd: root }).code, 0);
  assert.equal(ss([D, 'result', 'out/collect.json', 'products:collect'], { cwd: root }).code, 0);

  const res = readJson(path.join(root, 'out', 'collect.json'));
  assert.deepEqual(
    { command: res.command, issueId: res.issueId, status: res.status, phase: res.phase, needsHuman: res.needsHuman },
    { command: 'products:collect', issueId: 'NEW-12', status: 'planned', phase: 'refine', needsHuman: [] }
  );
  const st = readJson(path.join(root, D, 'state.json'));
  assert.equal(st.title, 'Export orders as CSV');
  const ev = readJsonl(path.join(root, D, 'events.jsonl'));
  assert.deepEqual(ev.map((e) => [e.type, e.status, e.phase]), [['status', 'planned', 'refine']]);

  // a split suggestion is a decision on the new session → blocked, and the next run consumes it
  ss([D, 'need', 'collect-split', 'decision', 'Split NEW-12?', '(a) keep (b) split'], { cwd: root });
  ss([D, 'result', 'out/collect.json', 'products:collect'], { cwd: root });
  const res2 = readJson(path.join(root, 'out', 'collect.json'));
  assert.equal(res2.status, 'blocked');
  assert.equal(res2.phase, 'refine');
  assert.deepEqual(res2.needsHuman.map((i: { id: string }) => i.id), ['collect-split']);
});

test('collect --headless flow (helper only): not enough information → no session, issueId null', () => {
  const root = tmpDir();
  const r = ss(
    ['result', 'out/collect.json', 'products:collect', '--need', 'collect-input', 'decision', 'Request too vague to title', '(a) … (b) …'],
    { cwd: root }
  );
  assert.equal(r.code, 0, r.err);
  const res = readJson(path.join(root, 'out', 'collect.json'));
  assert.equal(res.issueId, null);
  assert.equal(res.status, 'blocked');
  assert.equal(fs.existsSync(path.join(root, '.sessions')), false);
});

test('refine --headless answer loop (helper only): decision → approval.json → resolved → approval gate → done', () => {
  const dir = path.join(tmpDir(), '.sessions', 'NEW-12');
  ss([dir, 'set', '{"issueId":"NEW-12"}']);
  ss([dir, 'status', 'running', 'refine']);
  ss([dir, 'need', 'refine-scope', 'decision', 'Include PDF?', '(a) CSV only (b) CSV + PDF', 'refine-questions.md']);
  assert.equal(readJson(path.join(dir, 'state.json')).status, 'blocked');
  // the person answers; the re-run consumes it
  fs.writeFileSync(path.join(dir, 'approval.json'), JSON.stringify({ approved: true, by: 'jane', at: new Date(Date.now() + 1000).toISOString(), notes: 'refine-scope: (a)' }));
  const applied = JSON.parse(ss([dir, 'apply-approval']).out);
  assert.equal(applied.result, 'approved');
  assert.equal(applied.notes, 'refine-scope: (a)');
  ss([dir, 'need', 'refine-approval', 'approval', 'Refined requirements ready for review', 'approve', 'refined.md']);
  assert.equal(readJson(path.join(dir, 'state.json')).status, 'awaiting_approval');
  ss([dir, 'resolve', 'refine-approval']);
  ss([dir, 'status', 'done', 'refine']);
  const out = path.join(path.dirname(dir), '..', 'refine.json');
  ss([dir, 'result', out, 'products:refine']);
  const res = readJson(out);
  assert.deepEqual([res.status, res.phase, res.needsHuman], ['done', 'refine', []]);
});

// ---------------------------------------------------------------- command contract (3 languages)

const LANGS = ['en', 'pt-BR', 'es'];
const HEADLESS_COMMANDS: Array<{ file: string; id: string; prefix?: string; isNew?: boolean }> = [
  { file: 'orchestrate.md', id: 'orchestrate' },
  { file: 'engineer/pre-pr.md', id: 'engineer:pre-pr' },
  { file: 'engineer/pr.md', id: 'engineer:pr' },
  { file: 'engineer/merge.md', id: 'engineer:merge' },
  { file: 'products/collect.md', id: 'products:collect', prefix: 'collect-', isNew: true },
  { file: 'products/refine.md', id: 'products:refine', prefix: 'refine-', isNew: true },
  { file: 'products/spec.md', id: 'products:spec', prefix: 'spec-', isNew: true },
  { file: 'engineer/test-env.md', id: 'engineer:test-env', prefix: 'testenv-', isNew: true },
];
const cmdFile = (lang: string, rel: string) => path.join(ROOT, 'templates', 'commands', lang, rel);

test('contract: every headless command documents --headless and --result and writes its result via the helper', () => {
  for (const lang of LANGS) {
    for (const c of HEADLESS_COMMANDS) {
      const text = fs.readFileSync(cmdFile(lang, c.file), 'utf-8');
      const where = `${lang}/${c.file}`;
      assert.match(text, /--headless/, `${where}: --headless`);
      assert.match(text, /--result <(file|arquivo|archivo)>/, `${where}: --result <file>`);
      assert.ok(text.includes(`result <`) && text.includes(` ${c.id}`), `${where}: "result <file> ${c.id}"`);
      assert.match(text, /agents\/HEADLESS\.md/, `${where}: points to the shared protocol`);
    }
  }
});

test('contract: the 4 new headless commands turn questions into needsHuman items with valid kinds and prefixed ids', () => {
  for (const lang of LANGS) {
    for (const c of HEADLESS_COMMANDS.filter((x) => x.isNew)) {
      const text = fs.readFileSync(cmdFile(lang, c.file), 'utf-8');
      const where = `${lang}/${c.file}`;
      const needs = [...text.matchAll(/--need[ -]+([a-z0-9<>-]+)\s+(\w+)\s+"|SS need ([a-z0-9<>-]+) (\w+) "/g)].map((m) => ({
        id: m[1] ?? m[3],
        kind: m[2] ?? m[4],
      }));
      assert.ok(needs.length >= 2, `${where}: records needsHuman items (${needs.length})`);
      assert.ok(needs.some((n) => n.kind === 'decision'), `${where}: questions become decision items`);
      for (const n of needs) {
        assert.ok(KINDS.includes(n.kind), `${where}: kind "${n.kind}" of ${n.id}`);
        assert.ok(n.id.startsWith(c.prefix!), `${where}: id "${n.id}" starts with ${c.prefix}`);
      }
      // options in howToResolve: every decision lists concrete "(a) … (b)" choices
      const decisionLines = text.split('\n').filter((l) => /need[ -][^ ]+ decision "/.test(l) || /--need [^ ]+ decision "/.test(l));
      for (const l of decisionLines) assert.match(l, /\(a\).*\(b\)/, `${where}: options in howToResolve → ${l.trim().slice(0, 80)}`);
    }
  }
});

test('contract: collect --headless opens the session at refine and reports the created issue; HEADLESS.md in every language', () => {
  for (const lang of LANGS) {
    const collect = fs.readFileSync(cmdFile(lang, 'products/collect.md'), 'utf-8');
    assert.match(collect, /SS status planned refine/, `${lang}: session opened as planned·refine`);
    assert.match(collect, /session-state\.mjs result <(file|arquivo|archivo)> products:collect --need collect-input decision/, `${lang}: sessionless result`);
    const shared = fs.readFileSync(cmdFile(lang, 'agents/HEADLESS.md'), 'utf-8');
    for (const k of ['"command"', '"issueId"', '"status"', '"phase"', '"needsHuman"', '"at"']) assert.ok(shared.includes(k), `${lang} HEADLESS.md: ${k}`);
  }
});

// ---------------------------------------------------------------- install rule for the project-specific test-env

const quiet = async <T>(fn: () => Promise<T>): Promise<T> => {
  const log = console.log;
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
  }
};

test('install: test-env is seeded once and never overwritten (not even by update:commands)', async () => {
  const dir = tmpDir();
  await quiet(() => installCommands(dir, { lang: 'pt-BR', force: true }));
  const file = path.join(dir, '.claude', 'commands', 'engineer', 'test-env.md');
  assert.match(fs.readFileSync(file, 'utf-8'), /--headless/);
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'commands', 'agents', 'HEADLESS.md')));
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'bin', 'session-state.mjs')));

  fs.writeFileSync(file, '# my stack-specific test-env\n');
  const orchestrate = path.join(dir, '.claude', 'commands', 'orchestrate.md');
  fs.writeFileSync(orchestrate, 'stale');
  const written = await quiet(() => installCommands(dir, { lang: 'pt-BR', force: true })); // = update:commands
  assert.equal(fs.readFileSync(file, 'utf-8'), '# my stack-specific test-env\n');
  assert.notEqual(fs.readFileSync(orchestrate, 'utf-8'), 'stale'); // the rest is still refreshed
  assert.ok(!written.includes(file));
});

test('install: a project test-env elsewhere in the commands dir prevents the generic one', async () => {
  const dir = tmpDir();
  writeTree(dir, { '.claude/commands/test-env.md': '# custom at the root' });
  await quiet(() => installCommands(dir, { lang: 'en', force: true }));
  assert.equal(fs.existsSync(path.join(dir, '.claude', 'commands', 'engineer', 'test-env.md')), false);
  assert.equal(fs.readFileSync(path.join(dir, '.claude', 'commands', 'test-env.md'), 'utf-8'), '# custom at the root');
});
