import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { StoredState } from '../types.js';

const DEFAULT_STATE: StoredState = { offers: [] };

export class StateStore {
  private readonly filePath: string;

  constructor(filePath = path.join(process.cwd(), 'data', 'state.json')) {
    this.filePath = filePath;
  }

  async load(): Promise<StoredState> {
    try {
      const content = await readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as StoredState;
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  async save(state: StoredState): Promise<void> {
    const folder = path.dirname(this.filePath);
    await mkdir(folder, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2));
  }
}
