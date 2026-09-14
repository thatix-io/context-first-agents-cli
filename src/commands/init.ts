import path from 'node:path';
import chalk from 'chalk';
import { installCommands } from '../core/install-commands.js';
import { loadManifest, pathExists, exitWithError } from '../utils/config.js';

interface InitOpts {
  lang?: string;
  force?: boolean;
}

export async function initCommand(opts: InitOpts): Promise<void> {
  const cwd = process.cwd();
  console.log(chalk.bold('\nContext-First Agents — init\n'));

  const hasManifest = await pathExists(path.join(cwd, 'context-manifest.json'));
  if (!hasManifest) {
    console.log(
      chalk.yellow(
        'No context-manifest.json here. Run this inside an orchestrator, or use `create:orchestrator` first.'
      )
    );
  } else {
    const manifest = await loadManifest(cwd);
    if (!manifest) exitWithError('context-manifest.json is present but could not be parsed.');
    console.log(chalk.gray(`Project: ${manifest!.project} (${manifest!.repositories.length} repos)`));
  }

  console.log(chalk.bold('\nInstalling agent command templates:'));
  const written = await installCommands(cwd, { lang: opts.lang, force: opts.force });

  console.log(chalk.green(`\n✓ Installed ${written.length} command file(s).`));
  console.log(chalk.gray('\nFull flow in your AI tool:'));
  console.log(chalk.gray('  /warm-up → /collect → /refine → /spec → /orchestrate <ISSUE-ID>'));
  console.log(chalk.gray('  (/plan, /work, /pre-pr remain as manual escape hatches)\n'));
}
