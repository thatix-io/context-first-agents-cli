import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import chalk from 'chalk';
import { loadManifest, pathExists } from '../utils/config.js';
import { listSessions, readSession } from '../core/sessions.js';
import { templatesDir } from '../utils/paths.js';
import {
  readRegistry,
  isServerAlive,
  claimServer,
  attachProject,
  saveRegistry,
  type Registry,
} from '../core/registry.js';

interface DashboardOpts {
  port?: string;
  open?: boolean;
}

function openBrowser(url: string): void {
  let cmd: string;
  if (process.platform === 'darwin') cmd = `open "${url}"`;
  else if (process.platform === 'win32') cmd = `start "" "${url}"`;
  else cmd = `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function dashboardCommand(opts: DashboardOpts): Promise<void> {
  const cwd = process.cwd();
  if (!(await pathExists(path.join(cwd, 'context-manifest.json')))) {
    console.log(chalk.yellow('\nNo context-manifest.json here — run inside an orchestrator.\n'));
    process.exitCode = 1;
    return;
  }
  const manifest = await loadManifest(cwd);
  const projectName = manifest?.project ?? path.basename(cwd);

  // Is a dashboard already running elsewhere?
  const existing = await readRegistry();
  if (existing && (await isServerAlive(existing))) {
    const reg = await attachProject(existing, projectName, cwd, nowIso());
    const url = `http://localhost:${reg.port}/?project=${encodeURIComponent(projectName)}`;
    console.log(chalk.bold('\nContext-First Agents — dashboard\n'));
    console.log(chalk.green(`  ✓ Linked "${projectName}" to the running dashboard`));
    console.log(chalk.green(`  ▶ ${url}`));
    console.log(chalk.gray(`  ${reg.projects.length} project(s) now tracked. This command exits; the server keeps running.\n`));
    if (opts.open !== false) openBrowser(url);
    return;
  }

  // Become the server.
  await startServer(cwd, projectName, opts);
}

async function startServer(cwd: string, projectName: string, opts: DashboardOpts): Promise<void> {
  const port = Number(opts.port ?? 4517);
  const htmlPath = path.join(templatesDir(), 'dashboard', 'index.html');
  const html = (await pathExists(htmlPath))
    ? await fs.readFile(htmlPath, 'utf-8')
    : '<h1>dashboard asset missing</h1>';

  // In-memory registry mirror; the file is the source of truth for attach.
  await claimServer(port, process.pid, projectName, cwd, nowIso());

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);

      if (url.pathname === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, pid: process.pid }));
        return;
      }

      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      if (url.pathname === '/api/projects') {
        const reg = (await readRegistry()) as Registry;
        // enrich with a quick session count + running flag
        const projects = await Promise.all(
          (reg?.projects ?? []).map(async (p) => {
            const ids = await listSessions(p.path).catch(() => []);
            let running = 0;
            for (const id of ids) {
              const s = await readSession(p.path, id).catch(() => null);
              if (s?.status === 'running') running++;
            }
            return { name: p.name, path: p.path, sessions: ids.length, running };
          })
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ port, projects }));
        return;
      }

      if (url.pathname === '/api/sessions') {
        const reg = (await readRegistry()) as Registry;
        const proj = pickProject(reg, url.searchParams.get('project'));
        if (!proj) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'project not found' }));
          return;
        }
        const ids = await listSessions(proj.path);
        const sessions = await Promise.all(ids.map((id) => readSession(proj.path, id)));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ project: proj.name, path: proj.path, sessions }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  });

  server.on('error', async (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(chalk.yellow(`\nPort ${port} is in use. Try --port <n>, or another dashboard may be starting.\n`));
    } else {
      console.log(chalk.red(`\nServer error: ${err.message}\n`));
    }
    process.exitCode = 1;
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(chalk.bold('\nContext-First Agents — dashboard\n'));
    console.log(chalk.green(`  ▶ ${url}`));
    console.log(chalk.gray(`  Serving project "${projectName}" (+ any others linked with the same command).`));
    console.log(chalk.gray('  Run `context-agents dashboard` in another orchestrator to add it here.'));
    console.log(chalk.gray('  Press Ctrl+C to stop.\n'));
    if (opts.open !== false) openBrowser(url);
  });

  // Clean the registry on shutdown so stale servers aren't reported alive.
  const cleanup = async () => {
    const reg = await readRegistry();
    if (reg && reg.pid === process.pid) {
      await saveRegistry({ ...reg, pid: 0, port: 0 }).catch(() => {});
    }
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

function pickProject(reg: Registry | null, name: string | null) {
  if (!reg?.projects?.length) return null;
  if (name) {
    const byName = reg.projects.find((p) => p.name === name);
    if (byName) return byName;
  }
  return reg.projects[0];
}
