import { StorageAdapter } from './StorageAdapter';

export class MemoryStorage implements StorageAdapter {
  private data = new Map<string, string>();

  async save(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async load(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }
}
