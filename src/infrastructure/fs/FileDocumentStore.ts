import { access, open, readFile, realpath, rename, rm, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore } from '../../application/ports/DocumentStore.js';

export class FileDocumentStore implements DocumentStore {
  async read(path: string): Promise<string> { return readFile(path,'utf8'); }

  async write(path: string, content: string): Promise<void> {
    let target = resolve(path), mode = 0o666;
    try {
      const info = await stat(target);
      if (!info.isFile()) throw new Error('target is not a regular file');
      await access(target,constants.W_OK);
      target = await realpath(target); mode = info.mode & 0o777;
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
    }
    const temporary = join(dirname(target),`.${basename(target)}.${randomUUID()}.tmp`);
    let handle: Awaited<ReturnType<typeof open>> | null = null;
    try {
      handle = await open(temporary,'wx',mode); await handle.writeFile(content,'utf8');
      await handle.sync(); await handle.close(); handle = null;
      await rename(temporary,target);
    } finally {
      if (handle) await handle.close().catch(()=>undefined);
      await rm(temporary,{force:true});
    }
  }
}
