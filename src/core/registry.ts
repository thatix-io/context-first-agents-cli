import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

export interface RegistryProject {
  name: string;
  path: string;
  addedAt: string;
}

export interface Registry {
  port: number;
  pid: number;
  startedAt: string;
  projects: RegistryProject[];
}

function registryDir(): string {
  return path.join(os.homedir(), '.context-agents');
}
function registryFile(): string {
  return path.join(registryDir(), 'dashboard.json');
}

export async function readRegistry(): Promise<Registry | null> {
  try {
    return JSON.parse(await fs.readFile(registryFile(), 'utf-8')) as Registry;
  } catch {
    return null;
  }
}

async function writeRegistry(reg: Registry): Promise<void> {
  await fs.mkdir(registryDir(), { recursive: true });
  await fs.writeFile(registryFile(), JSON.stringify(reg, null, 2), 'utf-8');
}

/** Is a dashboard server actually answering on this registry's port? */
export async function isServerAlive(reg: Registry | null): Promise<boolean> {
  if (!reg?.port) return false;
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port: reg.port, path: '/api/ping', timeout: 700 },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** Add/refresh a project in the registry (dedup by resolved path). */
export function upsertProject(reg: Registry, name: string, projectPath: string, now: string): Registry {
  const resolved = path.resolve(projectPath);
  const projects = reg.projects.filter((p) => path.resolve(p.path) !== resolved);
  projects.push({ name, path: resolved, addedAt: now });
  projects.sort((a, b) => a.name.localeCompare(b.name));
  return { ...reg, projects };
}

/** Register this project as the server owner (we are starting the server). */
export async function claimServer(
  port: number,
  pid: number,
  name: string,
  projectPath: string,
  now: string
): Promise<Registry> {
  const existing = await readRegistry();
  const base: Registry = {
    port,
    pid,
    startedAt: now,
    projects: existing?.projects ?? [],
  };
  const reg = upsertProject(base, name, projectPath, now);
  await writeRegistry(reg);
  return reg;
}

/** Attach this project to an already-running server. Returns updated registry. */
export async function attachProject(
  reg: Registry,
  name: string,
  projectPath: string,
  now: string
): Promise<Registry> {
  const updated = upsertProject(reg, name, projectPath, now);
  await writeRegistry(updated);
  return updated;
}

/** Persist registry changes coming from the running server (e.g. new attach). */
export async function saveRegistry(reg: Registry): Promise<void> {
  await writeRegistry(reg);
}
