import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export class GroupCommand extends EditCommand {
  readonly #ids: readonly string[];
  constructor(private readonly id: string, ids: readonly string[]) { super(); this.#ids = [...ids]; }
  protected override apply(document: SvgDocument): string {
    const group = document.group(this.id,this.#ids); return `${group.label} created with ${group.children.length} children`;
  }
}
