import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export class UngroupCommand extends EditCommand {
  constructor(private readonly id: string) { super([id]); }
  protected override apply(document: SvgDocument): string {
    document.ungroup(this.id); return `g#${this.id} ungrouped`;
  }
}
