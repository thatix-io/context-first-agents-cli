import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { templatesDir } from '../utils/paths.js';
import { ensureDir, pathExists } from '../utils/config.js';

const SUPPORTED_LANGS = ['en', 'pt-BR'];

/**
 * Copy the agent command templates (.md) into an orchestrator's commands dir.
 * These .md files ARE the orchestration engine — Node only places them.
 */
export async function installCommands(
  orchestratorDir: string,
  opts: { lang?: string; force?: boolean; commandsDir?: string } = {}
): Promise<string[]> {
  const lang = SUPPORTED_LANGS.includes(opts.lang ?? '') ? opts.lang! : 'en';
  const commandsDir = opts.commandsDir ?? '.claude/commands';
  const srcRoot = path.join(templatesDir(), 'commands', lang);
  const destRoot = path.join(orchestratorDir, commandsDir);

  if (!(await pathExists(srcRoot))) {
    // Fall back to en if a lang folder is missing.
    return installCommands(orchestratorDir, { ...opts, lang: 'en' });
  }

  await ensureDir(destRoot);
  const written: string[] = [];
  await copyTree(srcRoot, destRoot, Boolean(opts.force), written);
  written.sort();
  for (const f of written) console.log(chalk.green(`  ✓ ${path.relative(orchestratorDir, f)}`));
  return written;
}

async function copyTree(src: string, dest: string, force: boolean, written: string[]) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await ensureDir(d);
      await copyTree(s, d, force, written);
    } else {
      if (!force && (await pathExists(d))) {
        console.log(chalk.gray(`  · skip (exists) ${e.name}`));
        continue;
      }
      await fs.copyFile(s, d);
      written.push(d);
    }
  }
}
