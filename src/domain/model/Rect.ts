import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export class Rect extends Shape {
  #x: number; #y: number; #width: number; #height: number;
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id); this.#x = Numeric.finite(x); this.#y = Numeric.finite(y);
    this.#width = Numeric.nonnegative(width); this.#height = Numeric.nonnegative(height);
  }
  override get tag(): string { return 'rect'; }
  override clone(): Rect { return this.copyCommonTo(new Rect(this.id, this.#x, this.#y, this.#width, this.#height)); }
  protected override geometry(): Readonly<Record<string, number>> {
    return { x: this.#x, y: this.#y, width: this.#width, height: this.#height };
  }
  protected override geometrySummary(): string { return `x=${this.#x} y=${this.#y} w=${this.#width} h=${this.#height}`; }
  protected override moveGeometry(dx: number, dy: number): void {
    const x = Numeric.finite(this.#x+dx), y = Numeric.finite(this.#y+dy);
    this.#x = x; this.#y = y;
  }
  protected override scaleGeometry(factor: number): void {
    const values = [this.#x, this.#y, this.#width, this.#height].map(value => Numeric.finite(value*factor));
    [this.#x, this.#y, this.#width, this.#height] = values as [number,number,number,number];
  }
  protected override setGeometry(attribute: string, value: string): boolean {
    if (!Object.hasOwn(this.geometry(), attribute)) return false;
    const number = Numeric.parse(value);
    if (attribute === 'x') this.#x = number;
    else if (attribute === 'y') this.#y = number;
    else if (attribute === 'width') this.#width = Numeric.nonnegative(number);
    else this.#height = Numeric.nonnegative(number);
    return true;
  }
}
