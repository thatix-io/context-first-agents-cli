import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { templatesDir } from '../utils/paths.js';
import { installCommands } from '../core/install-commands.js';
import {
  ensureDir,
  pathExists,
  exitWithError,
  type ContextManifest,
  DEFAULT_ARCHETYPES,
  DEFAULT_RISK_SIGNALS,
} from '../utils/config.js';

interface CreateOpts {
  lang?: string;
  project?: string;
  description?: string;
  yes?: boolean;
}

export async function createOrchestratorCommand(name: string | undefined, opts: CreateOpts): Promise<void> {
  console.log(chalk.bold('\nContext-First Agents — create:orchestrator\n'));

  // Non-interactive when there is no TTY (CI/pipes) or --yes is passed.
  const interactive = process.stdin.isTTY && !opts.yes;

  let answers: { name?: string; project?: string; description?: string };
  if (interactive) {
    answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Orchestrator directory name:',
        default: name ?? 'my-orchestrator',
        when: !name,
      },
      { type: 'input', name: 'project', message: 'Project name:', default: name ?? 'my-project' },
      { type: 'input', name: 'description', message: 'Description:', default: opts.description ?? '' },
    ]);
  } else {
    if (!name) exitWithError('Non-interactive mode requires a name argument (context-agents create:orchestrator <name>).');
    answers = {
      name,
      project: opts.project ?? name,
      description: opts.description ?? '',
    };
  }

  const dirName = name ?? answers.name!;
  const target = path.resolve(process.cwd(), dirName);
  if (await pathExists(target)) exitWithError(`Directory already exists: ${target}`);

  await ensureDir(target);
  await ensureDir(path.join(target, '.sessions'));

  // Seed a manifest with the orchestration block wired for agent routing.
  const manifest: ContextManifest = {
    version: '1.0',
    project: answers.project ?? dirName,
    description: answers.description ?? '',
    repositories: [
      {
        id: 'metaspecs',
        role: 'metaspecs',
        description: 'Normative specifications (source of truth)',
        mainBranch: 'main',
        hints: ['spec', 'adr', 'contract', 'documentation'],
      },
    ],
    orchestration: {
      archetypes: DEFAULT_ARCHETYPES,
      riskSignals: DEFAULT_RISK_SIGNALS,
      parallelism: { maxWorkers: 8, maxPerRepository: 2 },
      contextPolicy: 'select-do-not-dump',
      maxFilesPerWorker: 20,
      indexes: ['../metaspecs/specs/index.md'],
    },
  };
  await fs.writeFile(
    path.join(target, 'context-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // Copy the ai.properties template if present.
  const aiPropSrc = path.join(templatesDir(), 'orchestrator', 'ai.properties.md');
  if (await pathExists(aiPropSrc)) {
    await fs.copyFile(aiPropSrc, path.join(target, 'ai.properties.md'));
  }
  // .contextrc.json (local config, gitignored) — compatible with context-first-cli.
  await fs.writeFile(
    path.join(target, '.contextrc.json'),
    JSON.stringify(
      {
        orchestratorRepo: `file://${target}`,
        aiProvider: 'claude',
        commandsDir: '.claude/commands',
      },
      null,
      2
    ),
    'utf-8'
  );
  const gitignoreSrc = path.join(templatesDir(), 'orchestrator', 'gitignore');
  if (await pathExists(gitignoreSrc)) {
    await fs.copyFile(gitignoreSrc, path.join(target, '.gitignore'));
  }

  console.log(chalk.bold('\nInstalling agent command templates:'));
  await installCommands(target, { lang: opts.lang, force: true });

  console.log(chalk.green(`\n✓ Orchestrator created at ${target}`));
  console.log(chalk.gray('\nNext steps:'));
  console.log(chalk.gray(`  cd ${dirName}`));
  console.log(chalk.gray('  context-agents add:repo        # register your repositories'));
  console.log(chalk.gray('  context-agents doctor          # validate the setup'));
  console.log(chalk.gray('\nThen, in your AI tool, the full flow:'));
  console.log(chalk.gray('  /warm-up → /collect → /refine → /spec → /orchestrate <ISSUE-ID>'));
  console.log(chalk.gray('  (/plan, /work, /pre-pr remain as manual escape hatches)\n'));
}
