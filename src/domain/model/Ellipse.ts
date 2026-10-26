import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export class Ellipse extends Shape {
  #cx: number; #cy: number; #rx: number; #ry: number;
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id); this.#cx = Numeric.finite(cx); this.#cy = Numeric.finite(cy);
    this.#rx = Numeric.nonnegative(rx); this.#ry = Numeric.nonnegative(ry);
  }
  override get tag(): string { return 'ellipse'; }
  override clone(): Ellipse { return this.copyCommonTo(new Ellipse(this.id, this.#cx, this.#cy, this.#rx, this.#ry)); }
  protected override geometry(): Readonly<Record<string, number>> { return { cx: this.#cx, cy: this.#cy, rx: this.#rx, ry: this.#ry }; }
  protected override geometrySummary(): string { return `cx=${this.#cx} cy=${this.#cy} rx=${this.#rx} ry=${this.#ry}`; }
  protected override moveGeometry(dx: number, dy: number): void {
    const x = Numeric.finite(this.#cx+dx), y = Numeric.finite(this.#cy+dy);
    this.#cx = x; this.#cy = y;
  }
  protected override scaleGeometry(factor: number): void {
    const values = [this.#cx, this.#cy, this.#rx, this.#ry].map(value => Numeric.finite(value*factor));
    [this.#cx, this.#cy, this.#rx, this.#ry] = values as [number,number,number,number];
  }
  protected override setGeometry(attribute: string, value: string): boolean {
    if (!Object.hasOwn(this.geometry(), attribute)) return false;
    const number = Numeric.parse(value);
    if (attribute === 'cx') this.#cx = number;
    else if (attribute === 'cy') this.#cy = number;
    else if (attribute === 'rx') this.#rx = Numeric.nonnegative(number);
    else this.#ry = Numeric.nonnegative(number);
    return true;
  }
}
