import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.js';

// Runs the workflow script with a fake `agent` to check that its needsHuman[] items already
// follow the session contract (so /orchestrate can pass them to session-state.mjs as-is).
type AgentFn = (prompt: string, opts: { label: string }) => Promise<unknown>;
async function runWorkflow(args: unknown, agent: AgentFn) {
  const src = fs
    .readFileSync(path.join(ROOT, 'templates', 'workflows', 'orchestrate-execute.js'), 'utf-8')
    .replace('export const meta', 'const meta');
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const fn = new AsyncFunction('args', 'agent', 'parallel', 'log', src);
  const parallel = (fns: Array<() => Promise<unknown>>) => Promise.all(fns.map((f) => f()));
  return fn(args, agent, parallel, () => {});
}

const baseArgs = {
  issueId: 'AS-9',
  sessionDir: '/tmp/x/.sessions/AS-9',
  commandsDir: '/tmp/x/.claude/commands',
  stateHelper: '/tmp/x/.claude/bin/worker-state.mjs',
  repos: [{ id: 'back', worktree: '/tmp/x/.sessions/AS-9/back' }],
};

test('workflow: blocked worker and escalated spawn become contract-shaped needsHuman items', async () => {
  const result = await runWorkflow(
    {
      ...baseArgs,
      workers: [
        { id: 'W1', name: 'impl:back', archetype: 'implementer', repository: 'back', dependsOn: [], brief: 'b', contract: {} },
        { id: 'W2', name: 'impl:back-2', archetype: 'implementer', repository: 'back', dependsOn: [], brief: 'b', contract: {} },
      ],
    },
    async (_prompt, opts) => {
      if (opts.label === 'impl:back') {
        return { status: 'blocked', summary: 'cannot decide', unresolved: ['Which currency rounding rule applies?'], confidence: 'low' };
      }
      return {
        status: 'done',
        summary: 'ok',
        confidence: 'high',
        spawn: [{ name: 'Add DB migration', archetype: 'implementer', brief: 'x', inScope: true, newRisk: true }],
      };
    }
  );
  assert.equal(result.status, 'blocked');
  const byId = Object.fromEntries(result.needsHuman.map((i: { id: string }) => [i.id, i]));
  assert.deepEqual(Object.keys(byId).sort(), ['W1-blocked', 'spawn-W2-add-db-migration']);
  for (const item of result.needsHuman) {
    assert.ok(['approval', 'decision', 'access', 'failure'].includes(item.kind));
    assert.equal(typeof item.reason, 'string');
    assert.match(item.howToResolve, /\/orchestrate AS-9 --resume/);
    assert.match(item.ref, /^workers\/W\d\.md$/);
  }
  assert.equal(byId['W1-blocked'].kind, 'decision');
  assert.match(byId['W1-blocked'].reason, /Which currency rounding rule applies\?/);
  assert.equal(byId['spawn-W2-add-db-migration'].kind, 'approval');
});

test('workflow: a gate still failing after the fix rounds is a failure item', async () => {
  const result = await runWorkflow(
    {
      ...baseArgs,
      maxFixRounds: 1,
      workers: [
        { id: 'W1', name: 'impl:back', archetype: 'implementer', repository: 'back', dependsOn: [], brief: 'b', contract: {} },
        { id: 'W2', name: 'test:back', archetype: 'tester', repository: null, scope: ['back'], dependsOn: ['W1'], brief: 'b', contract: {} },
      ],
    },
    async (_prompt, opts) => {
      if (opts.label.startsWith('test:back')) {
        return { status: 'blocked', verdict: 'RED', summary: 'tests red', confidence: 'high', findings: [{ severity: 'blocking', repository: 'back', description: 'x fails' }] };
      }
      return { status: 'done', summary: 'ok', confidence: 'high', commits: ['abc'] };
    }
  );
  const item = result.needsHuman.find((i: { id: string }) => i.id === 'W2-blocked');
  assert.ok(item, JSON.stringify(result.needsHuman));
  assert.equal(item.kind, 'failure');
  assert.equal(item.ref, 'workers/W2.md');
});
