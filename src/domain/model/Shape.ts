import type { ShapeElement } from '../contracts/ShapeElement.js';
import type { Group } from './Group.js';
import { Numeric } from './Numeric.js';
import { Transform } from './Transform.js';

export abstract class Shape {
  readonly #id: string;
  #parent: Group | null = null;
  #transform = new Transform();
  #presentation = new Map<string, string>();

  protected constructor(id: string) {
    Shape.validateId(id);
    this.#id = id;
  }

  static validateId(id: string): void {
    if (!id || /\s/.test(id)) throw new Error(`invalid id: ${id}`);
  }

  abstract get tag(): string;
  abstract clone(): Shape;
  protected abstract geometry(): Readonly<Record<string, number>>;
  protected abstract geometrySummary(): string;
  protected abstract moveGeometry(dx: number, dy: number): void;
  protected abstract scaleGeometry(factor: number): void;
  protected abstract setGeometry(attribute: string, value: string): boolean;

  get id(): string { return this.#id; }
  get label(): string { return `${this.tag}#${this.id}`; }
  get parent(): Group | null { return this.#parent; }
  get transform(): Transform { return this.#transform; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | null { return null; }

  get attributes(): Readonly<Record<string, string>> {
    const attributes: Record<string, string> = { id: this.id };
    for (const [name, value] of Object.entries(this.geometry())) attributes[name] = Numeric.format(value);
    for (const [name, value] of this.#presentation) attributes[name] = value;
    if (!this.#transform.isIdentity) attributes['transform'] = this.#transform.toString();
    return attributes;
  }

  get summary(): string {
    const parts = [this.label, this.geometrySummary()];
    for (const [key, value] of this.#presentation) parts.push(`${key}=${value}`);
    if (!this.#transform.isIdentity) parts.push(`transform="${this.#transform}"`);
    return parts.filter(Boolean).join('  ');
  }

  asContainer(): Group { throw new Error(`not a container: ${this.id}`); }

  worldTransform(): Transform {
    return (this.parent?.worldTransform() ?? new Transform()).multiply(this.#transform);
  }

  isAncestorOf(shape: Shape): boolean {
    for (let parent = shape.parent; parent; parent = parent.parent) {
      if ((parent as Shape) === this) return true;
    }
    return false;
  }

  move(dx: number, dy: number): void {
    Numeric.finite(dx); Numeric.finite(dy);
    const [localX, localY] = this.#transform.inverse().vector(dx, dy);
    this.moveGeometry(localX, localY);
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('scale factor must be positive');
    const transform = this.#transform.scaledTranslation(factor);
    this.scaleGeometry(factor);
    this.#transform = transform;
  }

  set(attribute: string, value: string): void {
    if (['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      if (attribute === 'stroke-width') value = Numeric.format(Numeric.nonnegative(Numeric.parse(value)));
      this.#presentation.set(attribute, value);
      return;
    }
    if (!this.setGeometry(attribute, value)) throw new Error(`unknown attribute: ${attribute}`);
  }

  setTransform(transform: Transform): void { this.#transform = transform; }

  importPresentation(attribute: string, value: string): void {
    const supported = ['fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity', 'opacity',
      'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline',
      'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'fill-rule',
      'display', 'visibility', 'vector-effect', 'paint-order', 'letter-spacing', 'word-spacing'];
    if (!supported.includes(attribute) && !attribute.startsWith('data-') && !attribute.startsWith('aria-')) {
      throw new Error(`unsupported SVG attribute: ${attribute}`);
    }
    if (attribute === 'stroke-width') Numeric.nonnegative(Numeric.parse(value));
    this.#presentation.set(attribute, value);
  }

  inheritPresentationFrom(container: Shape): void {
    // Only inherited presentation properties survive removal of their former parent.
    for (const [name, value] of container.#presentation) {
      if (['opacity', 'display', 'vector-effect', 'paint-order'].includes(name) || name.startsWith('data-') || name.startsWith('aria-')) continue;
      if (!this.#presentation.has(name)) this.#presentation.set(name, value);
    }
  }

  toElement(): ShapeElement {
    return { tag: this.tag, attributes: this.attributes, text: this.textContent,
      children: this.children.map(child => child.toElement()) };
  }

  protected copyCommonTo<T extends Shape>(copy: T): T {
    copy.#transform = this.#transform;
    copy.#presentation = new Map(this.#presentation);
    return copy;
  }

  protected static linkParent(child: Shape, parent: Group | null): void { child.#parent = parent; }
}
