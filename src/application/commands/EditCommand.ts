import { DocumentSnapshot } from '../../domain/model/DocumentSnapshot.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export abstract class EditCommand {
  #before: DocumentSnapshot | null = null;
  #after: DocumentSnapshot | null = null;
  #summary = '';

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

  protected abstract apply(document: SvgDocument): string;
}
