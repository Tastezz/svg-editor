import { EditCommand } from './EditCommand.js';
import type { SvgDocument } from '../../domain/model/SvgDocument.js';
import type { ShapeFactory } from '../factories/ShapeFactory.js';

export class CreateCommand extends EditCommand {
  readonly #parameters: readonly string[];
  constructor(private readonly factory: ShapeFactory, private readonly type: string,
    private readonly id: string, parameters: readonly string[], private readonly parentId?: string) {
    super([id]); this.#parameters = [...parameters];
  }
  protected override apply(document: SvgDocument): string {
    const shape = this.factory.create(this.type,this.id,this.#parameters);
    document.add(shape,this.parentId);
    return `${shape.label} created${this.parentId === undefined ? '' : ` in g#${this.parentId}`}`;
  }
}
