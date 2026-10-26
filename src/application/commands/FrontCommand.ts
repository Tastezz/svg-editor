import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export class FrontCommand extends EditCommand {
  constructor(private readonly id: string) { super([id]); }
  protected override apply(document: SvgDocument): string {
    const label = document.find(this.id).label; document.front(this.id); return `${label} brought to front`;
  }
}
