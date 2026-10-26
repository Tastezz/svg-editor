import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export class Circle extends Shape {
  #cx: number; #cy: number; #r: number;
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id); this.#cx = Numeric.finite(cx); this.#cy = Numeric.finite(cy); this.#r = Numeric.nonnegative(r);
  }
  override get tag(): string { return 'circle'; }
  override clone(): Circle { return this.copyCommonTo(new Circle(this.id, this.#cx, this.#cy, this.#r)); }
  protected override geometry(): Readonly<Record<string, number>> { return { cx: this.#cx, cy: this.#cy, r: this.#r }; }
  protected override geometrySummary(): string { return `cx=${this.#cx} cy=${this.#cy} r=${this.#r}`; }
  protected override moveGeometry(dx: number, dy: number): void {
    const x = Numeric.finite(this.#cx+dx), y = Numeric.finite(this.#cy+dy);
    this.#cx = x; this.#cy = y;
  }
  protected override scaleGeometry(factor: number): void {
    const values = [this.#cx, this.#cy, this.#r].map(value => Numeric.finite(value*factor));
    [this.#cx, this.#cy, this.#r] = values as [number,number,number];
  }
  protected override setGeometry(attribute: string, value: string): boolean {
    if (!Object.hasOwn(this.geometry(), attribute)) return false;
    const number = Numeric.parse(value);
    if (attribute === 'cx') this.#cx = number;
    else if (attribute === 'cy') this.#cy = number;
    else this.#r = Numeric.nonnegative(number);
    return true;
  }
}
