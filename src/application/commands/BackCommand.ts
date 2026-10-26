import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export class BackCommand extends EditCommand {
  constructor(private readonly id: string) { super([id]); }
  protected override apply(document: SvgDocument): string {
    const label = document.find(this.id).label; document.back(this.id); return `${label} sent to back`;
  }
}
