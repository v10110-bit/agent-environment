import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const load = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const core = load('config/opencode.json').agents;
const optional = load('optional/english-learning/opencode.json').agents;
const settings = {
  'workspace-scope': '/example/workspace/*',
  'discovery-scope': '/example/workspace/tmp/discovery/*',
  'plans-scope': '/example/workspace/*/docs/plans/*',
};
const expand = (resource, configured) => resource.replace(
  /\{file:~\/\.config\/agent-environment\/([^}]+)\}/g,
  (_, name) => configured ? settings[name] : '',
);
const matches = (pattern, value) => {
  const regex = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${regex}$`).test(value)
    || (pattern.endsWith(' *') && pattern.slice(0, -2) === value);
};
const effect = (agent, action, resource, configured = true) =>
  agent.permissions.reduce((result, rule) =>
    matches(rule.action, action) && matches(expand(rule.resource, configured), resource)
      ? rule.effect : result, 'ask');

test('core roles, model choices, manual selection and generic prompts', () => {
  assert.deepEqual(Object.keys(core), ['discovery', 'plan', 'build', 'review']);
  for (const [id, variant] of Object.entries({
    discovery: 'high', plan: 'medium', build: 'low', review: 'high',
  })) {
    assert.equal(core[id].model, `opencode/gpt-6.1-sol#${variant}`);
    const prompt = readFileSync(new URL(`config/agents/${id}.md`, root), 'utf8');
    assert.match(prompt, /Never switch primary agents or delegate/);
    assert.match(prompt, /workspace and project AGENTS.md/);
    assert.doesNotMatch(prompt, /\/home\/v\/projects|platform\/apps/);
  }
});

test('role boundaries and unknown tools remain denied', () => {
  for (const agent of Object.values(core)) {
    for (const action of ['subagent', 'execute', 'unknown_mcp_tool']) {
      assert.equal(effect(agent, action, '*'), 'deny');
    }
    assert.equal(effect(agent, 'read', 'app.env'), 'ask');
    assert.equal(effect(agent, 'read', 'app.env.example'), 'allow');
    assert.equal(effect(agent, 'external_directory', '/elsewhere/*'), 'ask');
    assert.equal(effect(agent, 'external_directory', '/example/workspace/repo/*'), 'allow');
  }
  assert.equal(effect(core.discovery, 'edit', '/example/workspace/tmp/discovery/experiment/a'), 'allow');
  assert.equal(effect(core.discovery, 'edit', 'src/app.ts'), 'ask');
  assert.equal(effect(core.plan, 'edit', 'src/app.ts'), 'deny');
  assert.equal(effect(core.plan, 'edit', 'docs/plans/task.md'), 'ask');
  assert.equal(effect(core.plan, 'edit', '/example/workspace/repo/docs/plans/task.md'), 'ask');
  assert.equal(effect(core.review, 'edit', 'docs/plans/task.md'), 'deny');
  assert.equal(effect(core.build, 'edit', 'src/app.ts'), 'allow');
});

test('missing settings never broaden permissions', () => {
  for (const agent of Object.values(core)) {
    assert.equal(effect(agent, 'external_directory', '/example/workspace/repo/*', false), 'ask');
    assert.equal(effect(agent, 'external_directory', '/etc/*', false), 'ask');
  }
  assert.equal(effect(core.discovery, 'edit', '/example/workspace/tmp/discovery/a', false), 'ask');
  assert.equal(effect(core.plan, 'edit', '/example/workspace/repo/docs/plans/a', false), 'deny');
});

test('build routine commands and approval exceptions', () => {
  for (const command of ['git status', 'pnpm install', 'node test.mjs', 'bun test',
    'docker compose up --build', 'docker compose -p task down']) {
    assert.equal(effect(core.build, 'shell', command), 'allow', command);
  }
  for (const command of ['git commit -m task', 'git push', 'git reset --hard',
    'git clone https://example.test/repo', 'pnpm publish', 'pnpm -g add tool',
    'bun install', 'docker compose down --volumes', 'docker --context remote compose up',
    'sudo anything', 'rm -rf data']) {
    assert.equal(effect(core.build, 'shell', command), 'ask', command);
  }
  for (const id of ['discovery', 'plan', 'review']) {
    assert.equal(effect(core[id], 'shell', 'node test.mjs'), 'ask');
  }
});

test('English workflow is optional and narrowly scoped', () => {
  assert.deepEqual(Object.keys(optional), ['english-learning-curator']);
  const english = optional['english-learning-curator'];
  assert.equal(english.model, 'opencode/gpt-6.1-sol#high');
  assert.equal(effect(english, 'edit', 'flashcards.json'), 'ask');
  assert.equal(effect(english, 'edit', 'observations.json'), 'ask');
  assert.equal(effect(english, 'edit', 'anything-else'), 'deny');
  assert.equal(effect(english, 'shell', 'node export-anki.mjs'), 'allow');
  assert.equal(effect(english, 'shell', 'node other.mjs'), 'deny');
  assert.equal(effect(english, 'subagent', '*'), 'deny');
  assert.equal(effect(english, 'external_directory', '/elsewhere/*'), 'deny');
});

test('no shared config or prompt contains original machine path', () => {
  const walk = (directory) => {
    for (const entry of readdirSync(new URL(directory, root), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else assert.doesNotMatch(readFileSync(new URL(path, root), 'utf8'), /\/home\/v\/projects/);
    }
  };
  walk('config');
  walk('optional');
});
