import { SvgDocument } from '../domain/model/SvgDocument.js';
import type { EditCommand } from './commands/EditCommand.js';
import { CommandHistory } from './history/CommandHistory.js';
import type { DocumentStore } from './ports/DocumentStore.js';
import type { DocumentCodec } from './ports/DocumentCodec.js';

export class EditorSession {
  #document: SvgDocument | null = null;
  #sourcePath: string | null = null;
  readonly #history = new CommandHistory();
  constructor(private readonly store: DocumentStore, private readonly codec: DocumentCodec) {}
  get document(): SvgDocument {
    if (!this.#document) throw new Error("no document. use 'init' or 'read' first");
    return this.#document;
  }
  get sourcePath(): string | null { return this.#sourcePath; }
  get historyState(): Readonly<{ undo: number; redo: number; blocked: boolean }> { return this.#history.state; }

  init(width = 800, height = 600): string {
    const document = new SvgDocument(width,height);
    this.#document = document; this.#sourcePath = null; this.#history.barrier();
    return `canvas ${width}x${height} created`;
  }

  canvas(width?: number, height?: number): string {
    const current = this.document;
    if (width === undefined && height === undefined) return `canvas ${current.width}x${current.height}`;
    if (width === undefined || height === undefined) throw new Error('usage: canvas [w h]');
    const document = current.clone(); document.resize(width,height);
    this.#document = document; this.#history.barrier(); return `canvas resized to ${width}x${height}`;
  }

  execute(command: EditCommand): string {
    this.#document = this.#history.execute(command,this.document); return command.summary;
  }
  undo(): string {
    void this.document;
    const result = this.#history.undo(); this.#document = result.document; return result.message;
  }
  redo(): string {
    void this.document;
    const result = this.#history.redo(); this.#document = result.document; return result.message;
  }

  async read(path: string): Promise<string> {
    let content: string;
    try { content = await this.store.read(path); }
    catch { throw new Error(`cannot read file: ${path}`); }
    const decoded = this.codec.decode(content); decoded.document.validate();
    this.#document = decoded.document; this.#sourcePath = path; this.#history.barrier();
    return [...decoded.warnings,`read ${path} (${decoded.document.size} elements)`].join('\n');
  }

  async save(path?: string): Promise<string> {
    const document = this.document, target = path ?? this.#sourcePath;
    if (!target) throw new Error("no file path. use 'save <file.svg>'");
    const content = this.codec.encode(document);
    try { await this.store.write(target,content); }
    catch { throw new Error(`cannot write file: ${target}`); }
    this.#history.barrier(); return `saved to ${target} (${document.size} elements)`;
  }
}
