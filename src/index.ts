#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { createOrchestratorCommand } from './commands/create-orchestrator.js';
import { addRepoCommand } from './commands/add-repo.js';
import { updateCommandsCommand } from './commands/update-commands.js';
import { doctorCommand } from './commands/doctor.js';
import { statusCommand } from './commands/status.js';
import { dashboardCommand } from './commands/dashboard.js';

// package.json sits one level above both src/ (dev) and dist/ (published).
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8')) as {
  version: string;
};

const collect = (value: string, previous: string[] = []) => [...previous, value];

const program = new Command();

program
  .name('context-agents')
  .description(
    'Context-First Agents CLI — scaffold orchestrators and run dynamic, ephemeral AI agents from specs.\n' +
      'All agent orchestration lives in .md command templates; this Node CLI only scaffolds and manages.'
  )
  .version(pkg.version);

program
  .command('init')
  .description('Add Context-First Agents command templates to an existing orchestrator')
  .option('-l, --lang <lang>', 'Command language (en, es, pt-BR)', 'en')
  .option('-f, --force', 'Overwrite existing command files')
  .action(initCommand);

program
  .command('create:orchestrator [name]')
  .description('Create a new orchestrator directory (context-manifest.json + .md commands)')
  .option('-l, --lang <lang>', 'Command language (en, es, pt-BR)', 'en')
  .option('-p, --project <name>', 'Project name (non-interactive)')
  .option('-d, --description <text>', 'Project description (non-interactive)')
  .option('-y, --yes', 'Skip prompts and use defaults/flags')
  .action(createOrchestratorCommand);

program
  .command('add:repo')
  .description('Add a repository to context-manifest.json (with hints/context/testCommand)')
  .action(addRepoCommand);

program
  .command('update:commands')
  .description('Update the agent command templates in an existing orchestrator')
  .option('-l, --lang <lang>', 'Command language (en, es, pt-BR)', 'en')
  .action(updateCommandsCommand);

program
  .command('doctor')
  .description('Validate orchestrator config for agent orchestration (manifest, hints, indexes)')
  .action(doctorCommand);

program
  .command('status')
  .description('Show sessions with normalized status/phase/needsHuman (--json for machines)')
  .option('--json', 'Print [{ project, issueId, title, status, phase, needsHuman, updatedAt, path, legacy }]')
  .option('--project <dir>', 'Orchestrator directory (repeatable). Default: current dir, else dashboard projects', collect)
  .option('--all', 'Every project linked to the dashboard registry')
  .action(statusCommand);

program
  .command('dashboard')
  .description('Serve a local multi-project dashboard; run in any orchestrator to add it')
  .option('-p, --port <port>', 'Port to listen on', '4517')
  .option('--no-open', 'Do not open the browser automatically')
  .action(dashboardCommand);

program.parseAsync(process.argv);
