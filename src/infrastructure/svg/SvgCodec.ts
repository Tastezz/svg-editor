import { DOMParser, DOMImplementation, XMLSerializer, type Element, type Node, type Document } from '@xmldom/xmldom';
import { SvgDocument } from '../../domain/model/SvgDocument.js';
import type { ShapeElement } from '../../domain/contracts/ShapeElement.js';
import type { ShapeReader } from '../../application/ports/ShapeReader.js';
import type { ShapeInput } from '../../application/ports/ShapeInput.js';
import type { DocumentCodec, DecodedDocument } from '../../application/ports/DocumentCodec.js';
import { SvgNumbers } from './SvgNumbers.js';
import { SvgTransformParser } from './SvgTransformParser.js';
import { Numeric } from '../../domain/model/Numeric.js';
import { XmlValue } from '../../domain/model/XmlValue.js';

export class SvgCodec implements DocumentCodec {
  static readonly namespace = 'http://www.w3.org/2000/svg';
  readonly #transforms = new SvgTransformParser();
  constructor(private readonly factory: ShapeReader) {}

  decode(content: string): DecodedDocument {
    XmlValue.validate(content);
    if (/<!DOCTYPE\b/i.test(content)) throw new Error('unsupported SVG doctype');
    const xml = new DOMParser({onError:(_level,message)=>{throw new Error(`invalid SVG XML: ${message}`);}})
      .parseFromString(content,'image/svg+xml');
    const root = xml.documentElement;
    if (!root || (root.localName ?? root.tagName) !== 'svg') throw new Error('expected SVG root element');
    this.checkNamespace(root);
    this.checkInstructions(xml);
    const attributes = this.attributes(root), box = attributes['viewBox'] === undefined ? null : SvgNumbers.list(attributes['viewBox']);
    if (box && box.length !== 4) throw new Error('invalid SVG viewBox');
    const width = attributes['width'] === undefined ? (box?.[2] ?? 800) : SvgNumbers.length(attributes['width']);
    const height = attributes['height'] === undefined ? (box?.[3] ?? 600) : SvgNumbers.length(attributes['height']);
    const document = new SvgDocument(width,height);
    if (box) document.setViewBox(box as [number,number,number,number]);
    if (attributes['id']) document.setSvgId(attributes['id']);
    document.root.setTransform(this.#transforms.parse(attributes['transform'] ?? ''));
    for (const [name,value] of Object.entries(attributes)) {
      if (['xmlns','width','height','viewBox','id','transform'].includes(name)) continue;
      if (['version','preserveAspectRatio'].includes(name)) document.setRootMetadata(name,value);
      else document.root.importPresentation(name,value);
    }

    const used = new Set<string>();
    if (attributes['id']) used.add(attributes['id']);
    const elements: Element[] = [];
    const collect = (node: Element): void => {
      for (const child of this.elementChildren(node)) { elements.push(child); collect(child); }
    };
    collect(root);
    for (const element of elements) {
      this.checkNamespace(element);
      const id = element.getAttribute('id');
      if (!id) continue;
      if (used.has(id)) throw new Error(`id already exists: ${id}`);
      used.add(id);
    }

    const warnings: string[] = [], counters = new Map<string,number>();
    const read = (element: Element): ShapeInput => {
      const attrs = this.attributes(element), tag = element.localName ?? element.tagName;
      if (!attrs['id']) {
        let counter = counters.get(tag) ?? 0, id: string;
        do { id = `${tag}${++counter}`; } while (used.has(id));
        counters.set(tag,counter); used.add(id); attrs['id'] = id;
        warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      }
      const text = this.directText(element);
      return {tag,attributes:attrs,text:text || null,
        children:this.elementChildren(element).map(read),transform:this.#transforms.parse(attrs['transform'] ?? '')};
    };
    if (this.directText(root).trim()) throw new Error('unsupported text directly inside <svg>');
    for (const element of this.elementChildren(root)) document.add(this.factory.fromSvg(read(element)));
    document.validate(); return {document,warnings};
  }

  encode(document: SvgDocument): string {
    document.validate();
    const xml = new DOMImplementation().createDocument(SvgCodec.namespace,'svg',null);
    this.writeElement(xml,document.toElement(),xml.documentElement!);
    const serialized = new XMLSerializer().serializeToString(xml,{requireWellFormed:true});
    // Literal CR would be normalized to LF when XML is read back.
    return `<?xml version="1.0" encoding="UTF-8"?>\n${serialized.replace(/\r/g,'&#13;')}\n`;
  }

  private writeElement(document: Document, description: ShapeElement, element?: Element): Element {
    const result = element ?? document.createElementNS(SvgCodec.namespace,description.tag);
    for (const [name,value] of Object.entries(description.attributes)) result.setAttribute(name,value);
    if (description.text !== null) result.appendChild(document.createTextNode(description.text));
    for (const child of description.children) result.appendChild(this.writeElement(document,child));
    return result;
  }

  private attributes(element: Element): Record<string,string> {
    const attributes: Record<string,string> = Object.create(null) as Record<string,string>;
    for (let index=0;index<element.attributes.length;index++) {
      const attribute = element.attributes.item(index)!;
      if (attribute.name.startsWith('xmlns:')) continue;
      attributes[attribute.name] = attribute.value;
    }
    const style = attributes['style']; delete attributes['style'];
    if (style) {
      for (const declaration of style.split(';')) {
        if (!declaration.trim()) continue;
        const split = declaration.indexOf(':');
        if (split<1 || declaration.includes('!important')) throw new Error('unsupported SVG inline style');
        const name = declaration.slice(0,split).trim(), value = declaration.slice(split+1).trim();
        if (!value || name === 'transform') throw new Error('unsupported SVG inline style');
        attributes[name] = value;
      }
    }
    const lengths = ['x','y','width','height','cx','cy','r','rx','ry','x1','y1','x2','y2','stroke-width'];
    for (const name of lengths) if (attributes[name] !== undefined) attributes[name] = Numeric.format(SvgNumbers.length(attributes[name]));
    return attributes;
  }

  private elementChildren(node: Node): Element[] {
    const result: Element[] = [];
    for (let index=0;index<(node.childNodes?.length ?? 0);index++) {
      const child = node.childNodes.item(index)!;
      if (child.nodeType === 1) result.push(child as Element);
    }
    return result;
  }

  private directText(node: Node): string {
    let text = '';
    for (let index=0;index<(node.childNodes?.length ?? 0);index++) {
      const child = node.childNodes.item(index)!;
      if (child.nodeType === 3 || child.nodeType === 4) text += child.nodeValue ?? '';
    }
    return text;
  }

  private checkNamespace(element: Element): void {
    if (element.namespaceURI !== SvgCodec.namespace) throw new Error('unsupported SVG namespace');
  }
  private checkInstructions(node: Node): void {
    for (let index=0;index<(node.childNodes?.length ?? 0);index++) {
      const child = node.childNodes.item(index)!;
      if (child.nodeType === 7 && child.nodeName !== 'xml') throw new Error('unsupported SVG processing instruction');
      this.checkInstructions(child);
    }
  }
}
