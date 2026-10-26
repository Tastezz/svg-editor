import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';
import { XmlValue } from './XmlValue.js';

export class Text extends Shape {
  #x: number; #y: number; #content: string;
  constructor(id: string, x: number, y: number, content: string) {
    super(id); this.#x = Numeric.finite(x); this.#y = Numeric.finite(y); this.#content = XmlValue.validate(content);
  }
  override get tag(): string { return 'text'; }
  override get textContent(): string { return this.#content; }
  override clone(): Text { return this.copyCommonTo(new Text(this.id, this.#x, this.#y, this.#content)); }
  protected override geometry(): Readonly<Record<string, number>> { return { x: this.#x, y: this.#y }; }
  protected override geometrySummary(): string { return `(${this.#x},${this.#y}) ${JSON.stringify(this.#content)}`; }
  protected override moveGeometry(dx: number, dy: number): void {
    const x = Numeric.finite(this.#x+dx), y = Numeric.finite(this.#y+dy);
    this.#x = x; this.#y = y;
  }
  protected override scaleGeometry(factor: number): void {
    const x = Numeric.finite(this.#x*factor), y = Numeric.finite(this.#y*factor);
    this.#x = x; this.#y = y;
  }
  protected override setGeometry(attribute: string, value: string): boolean {
    if (attribute === 'text') { this.#content = XmlValue.validate(value); return true; }
    if (!Object.hasOwn(this.geometry(), attribute)) return false;
    const number = Numeric.parse(value);
    if (attribute === 'x') this.#x = number;
    else this.#y = number;
    return true;
  }
}
