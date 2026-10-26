import type { SvgDocument } from '../../domain/model/SvgDocument.js';
import type { EditCommand } from '../commands/EditCommand.js';

interface HistoryResult { readonly document: SvgDocument; readonly message: string; }

export class CommandHistory {
  #undo: EditCommand[] = [];
  #redo: EditCommand[] = [];
  #blocked = false;
  get state(): Readonly<{ undo: number; redo: number; blocked: boolean }> {
    return { undo: this.#undo.length, redo: this.#redo.length, blocked: this.#blocked };
  }

  execute(command: EditCommand, document: SvgDocument): SvgDocument {
    const result = command.execute(document);
    this.#undo.push(command); this.#redo = []; this.#blocked = false;
    return result;
  }

  undo(): HistoryResult {
    this.checkBarrier();
    const command = this.#undo.at(-1);
    if (!command) throw new Error('nothing to undo');
    const document = command.undo(); this.#undo.pop(); this.#redo.push(command);
    return { document, message: `undone: ${command.restoredSummary(document)}` };
  }

  redo(): HistoryResult {
    this.checkBarrier();
    const command = this.#redo.at(-1);
    if (!command) throw new Error('nothing to redo');
    const document = command.redo(); this.#redo.pop(); this.#undo.push(command);
    return { document, message: `redone: ${command.summary}` };
  }

  barrier(): void { this.#undo = []; this.#redo = []; this.#blocked = true; }
  private checkBarrier(): void { if (this.#blocked) throw new Error('undo not allowed after io command'); }
}
