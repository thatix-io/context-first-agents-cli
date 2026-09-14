import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  loadManifest,
  saveManifest,
  exitWithError,
  type Repository,
} from '../utils/config.js';

export async function addRepoCommand(): Promise<void> {
  console.log(chalk.bold('\nContext-First Agents — add:repo\n'));
  const cwd = process.cwd();
  const manifest = await loadManifest(cwd);
  if (!manifest) exitWithError('No context-manifest.json here. Run inside an orchestrator.');

  const a = await inquirer.prompt([
    { type: 'input', name: 'id', message: 'Repository id (folder name):', validate: (v) => !!v || 'required' },
    {
      type: 'list',
      name: 'role',
      message: 'Role:',
      choices: ['application', 'service', 'library', 'metaspecs', 'specs-provider'],
      default: 'application',
    },
    { type: 'input', name: 'url', message: 'Git URL (optional):', default: '' },
    { type: 'input', name: 'mainBranch', message: 'Main branch:', default: 'main' },
    {
      type: 'input',
      name: 'hints',
      message: 'Hints (comma-separated keywords that mean this repo is impacted):',
      default: '',
    },
    {
      type: 'input',
      name: 'context',
      message: 'Context files an agent here may read (comma-separated, optional):',
      default: '',
    },
    { type: 'input', name: 'testCommand', message: 'Test command (optional):', default: '' },
  ]);

  const split = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);

  const repo: Repository = {
    id: a.id,
    role: a.role,
    mainBranch: a.mainBranch,
    ...(a.url ? { url: a.url } : {}),
    ...(a.hints ? { hints: split(a.hints) } : {}),
    ...(a.context ? { context: split(a.context) } : {}),
    ...(a.testCommand ? { testCommand: a.testCommand } : {}),
  };

  if (manifest!.repositories.some((r) => r.id === repo.id)) {
    exitWithError(`Repository '${repo.id}' already exists in the manifest.`);
  }
  manifest!.repositories.push(repo);
  await saveManifest(cwd, manifest!);
  console.log(chalk.green(`\n✓ Added '${repo.id}'. Manifest now has ${manifest!.repositories.length} repos.\n`));
  if (!repo.hints) {
    console.log(
      chalk.yellow(
        'Tip: repos without `hints` are harder for the orchestrator to route. Add keywords later.\n'
      )
    );
  }
}
