import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export class Group extends Shape {
  #children: Shape[] = [];
  readonly #root: boolean;

  constructor(id: string, root = false) { super(id); this.#root = root; }
  override get tag(): string { return 'g'; }
  override get label(): string { return this.#root ? 'svg' : super.label; }
  get isRoot(): boolean { return this.#root; }
  override get children(): readonly Shape[] { return [...this.#children]; }
  override asContainer(): Group { return this; }
  indexOf(shape: Shape): number { return this.#children.indexOf(shape); }

  insert(shape: Shape, index = this.#children.length): void {
    if (shape === this || shape.isAncestorOf(this)) {
      throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    }
    if (!Number.isInteger(index) || index < 0 || index > this.#children.length) throw new Error('invalid child index');
    shape.parent?.remove(shape);
    this.#children.splice(Math.min(index, this.#children.length), 0, shape);
    Shape.linkParent(shape, this);
  }

  remove(shape: Shape): void {
    const index = this.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.#children.splice(index, 1);
    Shape.linkParent(shape, null);
  }

  override move(dx: number, dy: number): void {
    Numeric.finite(dx); Numeric.finite(dy);
    this.setTransform(this.transform.translated(dx, dy));
  }

  override clone(): Group {
    const copy = this.copyCommonTo(new Group(this.id, this.#root));
    for (const child of this.#children) copy.insert(child.clone());
    return copy;
  }

  protected override geometry(): Readonly<Record<string, number>> { return {}; }
  protected override geometrySummary(): string { return ''; }
  protected override moveGeometry(_dx: number, _dy: number): void { /* move uses the group transform */ }
  protected override scaleGeometry(factor: number): void {
    for (const child of this.#children) child.scale(factor);
  }
  protected override setGeometry(_attribute: string, _value: string): boolean { return false; }
}
