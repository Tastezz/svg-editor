import type { DocumentStore } from '../../src/application/ports/DocumentStore.js';

export class MemoryDocumentStore implements DocumentStore {
  readonly #files = new Map<string,string>();
  #failWrites = false;
  seed(path: string, content: string): void { this.#files.set(path,content); }
  failWrites(value: boolean): void { this.#failWrites = value; }
  async read(path: string): Promise<string> {
    const content = this.#files.get(path);
    if (content === undefined) throw new Error('missing file');
    return content;
  }
  async write(path: string, content: string): Promise<void> {
    if (this.#failWrites) throw new Error('unwritable file');
    this.#files.set(path,content);
  }
}
