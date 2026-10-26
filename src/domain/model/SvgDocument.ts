import { Group } from './Group.js';
import { Numeric } from './Numeric.js';
import { Shape } from './Shape.js';
import type { ShapeElement } from '../contracts/ShapeElement.js';
import { XmlValue } from './XmlValue.js';

export class SvgDocument {
  #width: number; #height: number;
  #viewBox: readonly [number, number, number, number];
  #root = new Group('__canvas__', true);
  #index = new Map<string, Shape>();
  #svgId: string | null = null;
  #rootMetadata = new Map<string,string>();

  constructor(width = 800, height = 600) {
    this.#width = Numeric.positive(width); this.#height = Numeric.positive(height);
    this.#viewBox = [0,0,width,height];
  }

  get width(): number { return this.#width; }
  get height(): number { return this.#height; }
  get root(): Group { return this.#root; }
  get size(): number { return this.#index.size; }
  get viewBox(): readonly [number, number, number, number] { return [...this.#viewBox]; }

  setSvgId(id: string): void {
    Shape.validateId(id);
    if (this.has(id)) throw new Error(`id already exists: ${id}`);
    this.#svgId = id;
  }

  setRootMetadata(name: string, value: string): void {
    XmlValue.validate(value);
    if (!['version','preserveAspectRatio'].includes(name)) throw new Error(`unsupported SVG root attribute: ${name}`);
    this.#rootMetadata.set(name,value);
  }

  resize(width: number, height: number): void {
    Numeric.positive(width); Numeric.positive(height);
    this.#width = width; this.#height = height; this.#viewBox = [0,0,width,height];
  }

  setViewBox(values: readonly [number, number, number, number]): void {
    values.forEach(Numeric.finite); Numeric.positive(values[2]); Numeric.positive(values[3]);
    this.#viewBox = [...values];
  }

  find(id: string): Shape {
    const shape = this.#index.get(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  has(id: string): boolean { return this.#index.has(id); }

  container(id?: string): Group {
    if (id === undefined) return this.#root;
    const shape = this.#index.get(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    return shape.asContainer();
  }

  add(shape: Shape, parentId?: string): void {
    const parent = this.container(parentId);
    const incoming = new Set<string>();
    for (const node of this.walk(shape)) {
      if (this.has(node.id) || incoming.has(node.id) || node.id === this.#svgId) throw new Error(`id already exists: ${node.id}`);
      incoming.add(node.id);
    }
    if (shape.parent) throw new Error(`shape already belongs to a container: ${shape.id}`);
    parent.insert(shape);
    this.validate();
  }

  delete(id: string): void {
    const shape = this.find(id);
    shape.parent!.remove(shape);
    this.validate();
  }

  addTo(groupId: string, id: string): void {
    const target = this.container(groupId), shape = this.find(id);
    if (target === shape || shape.isAncestorOf(target)) {
      throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    }
    let ancestor = target;
    while (!ancestor.isAncestorOf(shape)) ancestor = ancestor.parent!;
    const transform = target.relativeTransformTo(ancestor).inverse().multiply(shape.relativeTransformTo(ancestor));
    target.insert(shape);
    shape.setTransform(transform);
    this.validate();
  }

  group(id: string, ids: readonly string[]): Group {
    Shape.validateId(id);
    if (this.has(id) || id === this.#svgId) throw new Error(`id already exists: ${id}`);
    if (ids.length < 2) throw new Error('group requires at least two shapes');
    if (new Set(ids).size !== ids.length) throw new Error('cannot group the same shape twice');
    const selected = ids.map(selectedId => this.find(selectedId));
    for (const shape of selected) {
      if (selected.some(other => shape !== other && shape.isAncestorOf(other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    const order = this.walk(this.#root);
    selected.sort((a,b) => order.indexOf(a)-order.indexOf(b));
    let parent = selected[0]!.parent!;
    while (!selected.every(shape => parent.isAncestorOf(shape))) parent = parent.parent!;
    const branches = selected.map(shape => {
      while (shape.parent !== parent) shape = shape.parent!;
      return shape;
    });
    const insertion = Math.min(...branches.map(shape => parent.indexOf(shape)));
    const transforms = selected.map(shape => shape.relativeTransformTo(parent));
    const group = new Group(id);
    parent.insert(group, insertion);
    selected.forEach((shape, index) => {
      group.insert(shape); shape.setTransform(transforms[index]!);
    });
    this.validate();
    return group;
  }

  ungroup(id: string): void {
    const group = this.find(id).asContainer(), parent = group.parent!;
    if (parent.isRoot) throw new Error(`cannot ungroup top-level container: ${id}`);
    const children = group.children, index = parent.indexOf(group);
    const transforms = children.map(shape => shape.relativeTransformTo(parent));
    children.forEach((shape, offset) => {
      shape.inheritPresentationFrom(group);
      parent.insert(shape, index+offset);
      shape.setTransform(transforms[offset]!);
    });
    parent.remove(group);
    this.validate();
  }

  front(id: string): void {
    const shape = this.find(id), parent = shape.parent!;
    parent.insert(shape); this.validate();
  }

  back(id: string): void {
    const shape = this.find(id), parent = shape.parent!;
    parent.insert(shape, 0); this.validate();
  }

  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    copy.#viewBox = [...this.#viewBox]; copy.#root = this.#root.clone();
    copy.#svgId = this.#svgId; copy.#rootMetadata = new Map(this.#rootMetadata);
    copy.validate(); return copy;
  }

  toElement(): ShapeElement {
    const { id: _id, ...rootAttributes } = this.root.attributes;
    return { tag: 'svg', text: null, attributes: { xmlns: 'http://www.w3.org/2000/svg',
      width: Numeric.format(this.width), height: Numeric.format(this.height), viewBox: this.#viewBox.join(' '),
      ...Object.fromEntries(this.#rootMetadata), ...rootAttributes, ...(this.#svgId === null ? {} : {id:this.#svgId}) },
      children: this.root.children.map(shape => shape.toElement()) };
  }

  validate(): void {
    const index = new Map<string, Shape>(), visited = new Set<Shape>();
    const visit = (shape: Shape): void => {
      if (visited.has(shape)) throw new Error('cyclic or shared shape in document');
      visited.add(shape);
      if (shape !== this.#root) {
        if (index.has(shape.id) || shape.id === this.#svgId) throw new Error(`id already exists: ${shape.id}`);
        index.set(shape.id, shape);
      }
      for (const child of shape.children) {
        if (child.parent !== shape) throw new Error('inconsistent parent link');
        visit(child);
      }
    };
    visit(this.#root); this.#index = index;
  }

  private walk(root: Shape): Shape[] { return [root, ...root.children.flatMap(child => this.walk(child))]; }
}
