import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { templatesDir } from '../utils/paths.js';
import { ensureDir, pathExists } from '../utils/config.js';

const SUPPORTED_LANGS = ['en', 'es', 'pt-BR'];

/**
 * Project-specific commands: the template is only a starting point that each project adapts
 * (stack, ports, scripts). It is installed when the project has no command of that name
 * anywhere in its commands dir, and **never overwritten** — not even by `update:commands`.
 */
export const SEED_COMMANDS = ['engineer/test-env.md'];

/**
 * Copy the agent command templates (.md) into an orchestrator's commands dir, plus the
 * language-independent engine files into sibling dirs: `.claude/workflows/` (the scripts
 * /orchestrate runs via the Workflow tool) and `.claude/bin/` (the worker state helper).
 * These files ARE the orchestration engine — Node only places them.
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
  const existing = await listFiles(destRoot);
  const keep = new Set(
    SEED_COMMANDS.filter((rel) => existing.some((f) => path.basename(f) === path.basename(rel))).map((rel) =>
      path.join(srcRoot, rel)
    )
  );
  await copyTree(srcRoot, destRoot, Boolean(opts.force), written, keep);

  // Language-independent engine files: workflow scripts + the worker state helper they call.
  for (const dir of ['workflows', 'bin']) {
    const src = path.join(templatesDir(), dir);
    if (!(await pathExists(src))) continue;
    const dest = path.join(orchestratorDir, path.dirname(commandsDir), dir);
    await ensureDir(dest);
    await copyTree(src, dest, Boolean(opts.force), written);
  }
  written.sort();
  for (const f of written) console.log(chalk.green(`  ✓ ${path.relative(orchestratorDir, f)}`));
  return written;
}

/** Every file under `dir` (recursive); empty when it does not exist. */
async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p)));
    else out.push(p);
  }
  return out;
}

async function copyTree(
  src: string,
  dest: string,
  force: boolean,
  written: string[],
  keep: Set<string> = new Set()
) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await ensureDir(d);
      await copyTree(s, d, force, written, keep);
    } else {
      if (keep.has(s)) {
        console.log(chalk.gray(`  · keep (project-specific) ${e.name}`));
        continue;
      }
      if (!force && (await pathExists(d))) {
        console.log(chalk.gray(`  · skip (exists) ${e.name}`));
        continue;
      }
      await fs.copyFile(s, d);
      written.push(d);
    }
  }
}
