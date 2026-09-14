import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import chalk from 'chalk';
import { loadManifest, pathExists } from '../utils/config.js';
import { listSessions, readSession } from '../core/sessions.js';
import { templatesDir } from '../utils/paths.js';

interface DashboardOpts {
  port?: string;
}

export async function dashboardCommand(opts: DashboardOpts): Promise<void> {
  const cwd = process.cwd();
  const port = Number(opts.port ?? 4517);

  if (!(await pathExists(path.join(cwd, 'context-manifest.json')))) {
    console.log(chalk.yellow('\nNo context-manifest.json here — run inside an orchestrator.\n'));
    process.exitCode = 1;
    return;
  }

  const htmlPath = path.join(templatesDir(), 'dashboard', 'index.html');
  const html = (await pathExists(htmlPath)) ? await fs.readFile(htmlPath, 'utf-8') : '<h1>dashboard asset missing</h1>';

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
      if (url.pathname === '/api/sessions') {
        const manifest = await loadManifest(cwd);
        const ids = await listSessions(cwd);
        const sessions = await Promise.all(ids.map((id) => readSession(cwd, id)));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ project: manifest?.project ?? 'orchestrator', sessions }));
        return;
      }
      if (url.pathname === '/api/session') {
        const id = url.searchParams.get('id') ?? '';
        const session = await readSession(cwd, id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  });

  server.listen(port, () => {
    console.log(chalk.bold('\nContext-First Agents — dashboard\n'));
    console.log(chalk.green(`  ▶ http://localhost:${port}`));
    console.log(chalk.gray(`  Reading sessions from ${path.join(cwd, '.sessions')}`));
    console.log(chalk.gray('  Press Ctrl+C to stop.\n'));
  });
}
