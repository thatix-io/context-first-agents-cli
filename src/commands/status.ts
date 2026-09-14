import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { loadManifest, pathExists } from '../utils/config.js';

export async function statusCommand(): Promise<void> {
  console.log(chalk.bold('\nContext-First Agents — status\n'));
  const cwd = process.cwd();
  const manifest = await loadManifest(cwd);
  if (!manifest) {
    console.log(chalk.yellow('No context-manifest.json here.\n'));
    return;
  }

  console.log(chalk.bold(`${manifest.project}`) + chalk.gray(` — ${manifest.description ?? ''}`));
  console.log(chalk.gray(`Repositories (${manifest.repositories.length}):`));
  for (const r of manifest.repositories) {
    console.log(`  • ${r.id} [${r.role}]${r.hints?.length ? chalk.gray(` — ${r.hints.join(', ')}`) : ''}`);
  }

  const risk = manifest.orchestration?.riskSignals ?? [];
  if (risk.length) console.log(chalk.gray(`\nRisk signals: ${risk.join(', ')}`));

  const sessionsDir = path.join(cwd, '.sessions');
  if (await pathExists(sessionsDir)) {
    const entries = (await fs.readdir(sessionsDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
      .map((e) => e.name);
    console.log(chalk.bold(`\nActive sessions (${entries.length}):`));
    for (const s of entries.sort()) console.log(`  • ${s}`);
  }
  console.log('');
}
