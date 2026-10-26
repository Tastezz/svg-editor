import { DocumentSnapshot } from '../../domain/model/DocumentSnapshot.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export abstract class EditCommand {
  #before: DocumentSnapshot | null = null;
  #after: DocumentSnapshot | null = null;
  #summary = '';
  readonly #affectedIds: readonly string[];

  protected constructor(affectedIds: readonly string[]) { this.#affectedIds = [...affectedIds]; }

  get summary(): string { return this.#summary; }

  execute(document: SvgDocument): SvgDocument {
    if (this.#before) throw new Error('command already executed');
    const before = new DocumentSnapshot(document), draft = before.restore();
    const summary = this.apply(draft);
    draft.validate();
    const after = new DocumentSnapshot(draft);
    this.#before = before; this.#after = after; this.#summary = summary;
    return draft;
  }

  undo(): SvgDocument {
    if (!this.#before) throw new Error('command has not executed');
    return this.#before.restore();
  }

  redo(): SvgDocument {
    if (!this.#after) throw new Error('command has not executed');
    return this.#after.restore();
  }

  restoredSummary(document: SvgDocument): string {
    return this.#affectedIds.map(id=>{
      if (!document.has(id)) return `shape#${id} absent`;
      const shape = document.find(id);
      return `${shape.summary}  parent=${shape.parent?.label ?? 'none'} index=${shape.parent?.indexOf(shape) ?? 0}`;
    }).join('; ');
  }

  protected abstract apply(document: SvgDocument): string;
}
