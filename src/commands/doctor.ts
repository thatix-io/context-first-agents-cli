import path from 'node:path';
import chalk from 'chalk';
import { loadManifest, pathExists } from '../utils/config.js';
import { repoLocalPath } from '../utils/paths.js';

export async function doctorCommand(): Promise<void> {
  console.log(chalk.bold('\nContext-First Agents — doctor\n'));
  const cwd = process.cwd();
  let problems = 0;
  let warnings = 0;

  const manifest = await loadManifest(cwd);
  if (!manifest) {
    console.log(chalk.red('✗ context-manifest.json not found or invalid.'));
    console.log(chalk.gray('  Run inside an orchestrator, or `create:orchestrator`.\n'));
    process.exitCode = 1;
    return;
  }
  console.log(chalk.green(`✓ Manifest OK — ${manifest.project} (${manifest.repositories.length} repos)`));

  // Commands installed? Check the full flow (product → orchestrate → engineer escape hatches).
  const commandsDir = path.join(cwd, '.claude', 'commands');
  const flow: Array<{ file: string; label: string; required?: boolean }> = [
    { file: 'warm-up.md', label: '/warm-up' },
    { file: 'products/collect.md', label: '/collect' },
    { file: 'products/refine.md', label: '/refine' },
    { file: 'products/spec.md', label: '/spec' },
    { file: 'orchestrate.md', label: '/orchestrate', required: true },
  ];
  const missing: string[] = [];
  for (const step of flow) {
    if (!(await pathExists(path.join(commandsDir, step.file)))) missing.push(step.label);
  }
  if (!missing.length) {
    console.log(chalk.green('✓ Full command flow installed (warm-up → collect → refine → spec → orchestrate)'));
  } else if (missing.includes('/orchestrate')) {
    console.log(chalk.red(`✗ Core command /orchestrate missing — run \`context-agents init\``));
    problems++;
  } else {
    console.log(chalk.yellow(`! Some flow commands missing (${missing.join(', ')}) — run \`context-agents init\` to install them`));
    warnings++;
  }

  // Orchestration block
  const orch = manifest.orchestration;
  if (!orch?.riskSignals?.length) {
    console.log(chalk.yellow('! No orchestration.riskSignals — risky tasks won\'t trigger adversarial review'));
    warnings++;
  } else {
    console.log(chalk.green(`✓ ${orch.riskSignals.length} risk signals configured`));
  }
  if (!orch?.indexes?.length) {
    console.log(chalk.yellow('! No orchestration.indexes — agents have no project-wide context router'));
    warnings++;
  }

  // Per-repo checks
  console.log(chalk.bold('\nRepositories:'));
  for (const repo of manifest.repositories) {
    const local = repoLocalPath(cwd, repo);
    const exists = await pathExists(local);
    const status = exists ? chalk.green('found') : chalk.yellow('missing locally');
    const hints = repo.hints?.length ? chalk.gray(`hints: ${repo.hints.join(', ')}`) : chalk.yellow('no hints');
    console.log(`  ${exists ? '✓' : '!'} ${repo.id} [${repo.role}] — ${status}; ${hints}`);
    if (!exists) warnings++;
    if (!repo.hints?.length && repo.role !== 'metaspecs') warnings++;
    if (repo.role === 'application' && !repo.testCommand) {
      console.log(chalk.gray(`      (no testCommand — tester agent will fall back to project defaults)`));
    }
  }

  console.log('');
  if (problems) console.log(chalk.red(`${problems} problem(s)`));
  if (warnings) console.log(chalk.yellow(`${warnings} warning(s)`));
  if (!problems && !warnings) console.log(chalk.green('All good. Ready to /orchestrate.'));
  console.log('');
  if (problems) process.exitCode = 1;
}
