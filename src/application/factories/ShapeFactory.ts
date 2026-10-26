import { Rect } from '../../domain/model/Rect.js';
import { Circle } from '../../domain/model/Circle.js';
import { Ellipse } from '../../domain/model/Ellipse.js';
import { Line } from '../../domain/model/Line.js';
import { Text } from '../../domain/model/Text.js';
import { Group } from '../../domain/model/Group.js';
import { Numeric } from '../../domain/model/Numeric.js';
import type { Shape } from '../../domain/model/Shape.js';
import type { ShapeInput } from '../ports/ShapeInput.js';
import type { ShapeReader } from '../ports/ShapeReader.js';

interface ShapeProvider {
  readonly geometry: readonly string[];
  readonly text: boolean;
  readonly create: (id: string, parameters: readonly string[]) => Shape;
}

/** D2: the only shape-type dispatch. Replace built-ins with providers in a later phase. */
export class ShapeFactory implements ShapeReader {
  readonly #providers = new Map<string, ShapeProvider>([
    ['rect', { geometry: ['x','y','width','height'], text: false, create: (id,p) => {
      this.count(p,4,5); return this.styled(new Rect(id,...this.numbers(p,4) as [number,number,number,number]),'fill',p[4]);
    }}],
    ['circle', { geometry: ['cx','cy','r'], text: false, create: (id,p) => {
      this.count(p,3,4); return this.styled(new Circle(id,...this.numbers(p,3) as [number,number,number]),'fill',p[3]);
    }}],
    ['ellipse', { geometry: ['cx','cy','rx','ry'], text: false, create: (id,p) => {
      this.count(p,4,5); return this.styled(new Ellipse(id,...this.numbers(p,4) as [number,number,number,number]),'fill',p[4]);
    }}],
    ['line', { geometry: ['x1','y1','x2','y2'], text: false, create: (id,p) => {
      this.count(p,4,5); return this.styled(new Line(id,...this.numbers(p,4) as [number,number,number,number]),'stroke',p[4]);
    }}],
    ['text', { geometry: ['x','y'], text: true, create: (id,p) => {
      this.count(p,3,3); return new Text(id,Numeric.parse(p[0]!),Numeric.parse(p[1]!),p[2]!);
    }}],
    ['g', { geometry: [], text: false, create: (id,p) => { this.count(p,0,0); return new Group(id); }}],
  ]);

  create(type: string, id: string, parameters: readonly string[]): Shape {
    return this.provider(type).create(id, parameters);
  }

  fromSvg(input: ShapeInput): Shape {
    const provider = this.provider(input.tag), id = input.attributes['id'];
    if (!id) throw new Error('SVG adapter must assign missing ids before construction');
    const parameters = provider.geometry.map(name => input.attributes[name] ?? '0');
    if (provider.text) parameters.push(input.text ?? '');
    else if (input.text?.trim()) throw new Error(`unsupported text inside <${input.tag}>`);
    const shape = provider.create(id, parameters);
    shape.setTransform(input.transform);
    for (const [name,value] of Object.entries(input.attributes)) {
      if (name === 'id' || name === 'transform' || provider.geometry.includes(name)) continue;
      shape.importPresentation(name,value);
    }
    if (input.children.length) {
      const container = shape.asContainer();
      for (const child of input.children) container.insert(this.fromSvg(child));
    }
    return shape;
  }

  private provider(type: string): ShapeProvider {
    const provider = this.#providers.get(type);
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return provider;
  }
  private count(parameters: readonly string[], minimum: number, maximum: number): void {
    if (parameters.length < minimum || parameters.length > maximum) throw new Error('invalid shape parameters');
  }
  private numbers(parameters: readonly string[], count: number): number[] { return parameters.slice(0,count).map(Numeric.parse); }
  private styled(shape: Shape, name: string, value: string | undefined): Shape {
    if (value !== undefined) shape.set(name,value);
    return shape;
  }
}
