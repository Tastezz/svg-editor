import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export class Line extends Shape {
  #x1: number; #y1: number; #x2: number; #y2: number;
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id); this.#x1 = Numeric.finite(x1); this.#y1 = Numeric.finite(y1);
    this.#x2 = Numeric.finite(x2); this.#y2 = Numeric.finite(y2);
  }
  override get tag(): string { return 'line'; }
  override clone(): Line { return this.copyCommonTo(new Line(this.id, this.#x1, this.#y1, this.#x2, this.#y2)); }
  protected override geometry(): Readonly<Record<string, number>> { return { x1: this.#x1, y1: this.#y1, x2: this.#x2, y2: this.#y2 }; }
  protected override geometrySummary(): string { return `(${this.#x1},${this.#y1}) -> (${this.#x2},${this.#y2})`; }
  protected override moveGeometry(dx: number, dy: number): void {
    const values = [this.#x1+dx, this.#y1+dy, this.#x2+dx, this.#y2+dy].map(Numeric.finite);
    [this.#x1, this.#y1, this.#x2, this.#y2] = values as [number,number,number,number];
  }
  protected override scaleGeometry(factor: number): void {
    const values = [this.#x1, this.#y1, this.#x2, this.#y2].map(value => Numeric.finite(value*factor));
    [this.#x1, this.#y1, this.#x2, this.#y2] = values as [number,number,number,number];
  }
  protected override setGeometry(attribute: string, value: string): boolean {
    if (!Object.hasOwn(this.geometry(), attribute)) return false;
    const number = Numeric.parse(value);
    if (attribute === 'x1') this.#x1 = number;
    else if (attribute === 'y1') this.#y1 = number;
    else if (attribute === 'x2') this.#x2 = number;
    else this.#y2 = number;
    return true;
  }
}
