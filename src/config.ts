import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { FixtureQuery } from './types.js';

export interface SourceConfig {
  name: string;
  enabled: boolean;
}

export interface RuntimeConfig {
  sources: SourceConfig[];
  queries: FixtureQuery[];
}

async function loadJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const root = process.cwd();
  const sourcesPath = path.join(root, 'sources.json');
  const queriesPath = path.join(root, 'queries.json');
  const [sources, queries] = await Promise.all([
    loadJsonFile<SourceConfig[]>(sourcesPath),
    loadJsonFile<FixtureQuery[]>(queriesPath),
  ]);

  return { sources, queries };
}
