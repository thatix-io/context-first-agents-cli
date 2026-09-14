import chalk from 'chalk';
import { installCommands } from '../core/install-commands.js';

interface UpdateOpts {
  lang?: string;
}

export async function updateCommandsCommand(opts: UpdateOpts): Promise<void> {
  console.log(chalk.bold('\nContext-First Agents — update:commands\n'));
  const written = await installCommands(process.cwd(), { lang: opts.lang, force: true });
  console.log(chalk.green(`\n✓ Updated ${written.length} command file(s).\n`));
}
