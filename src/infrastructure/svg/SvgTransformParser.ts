import { Transform } from '../../domain/model/Transform.js';
import { SvgNumbers } from './SvgNumbers.js';

/** Parses mathematical SVG syntax; does not dispatch shape types. */
export class SvgTransformParser {
  parse(value: string): Transform {
    let rest = value.trim(), result = new Transform();
    while (rest) {
      const match = /^([A-Za-z]+)\s*\(([^()]*)\)/.exec(rest);
      if (!match) throw new Error(`invalid SVG transform: ${value}`);
      const name = match[1]!, numbers = SvgNumbers.list(match[2]!);
      result = result.multiply(this.operation(name,numbers));
      rest = rest.slice(match[0].length).trimStart();
      if (rest.startsWith(',')) {
        rest = rest.slice(1).trimStart();
        if (!rest) throw new Error(`invalid SVG transform: ${value}`);
      }
    }
    return result;
  }

  private operation(name: string, p: readonly number[]): Transform {
    if (name === 'matrix') { this.count(p,[6]); return new Transform(...p as [number,number,number,number,number,number]); }
    if (name === 'translate') { this.count(p,[1,2]); return new Transform(1,0,0,1,p[0]!,p[1] ?? 0); }
    if (name === 'scale') { this.count(p,[1,2]); return new Transform(p[0]!,0,0,p[1] ?? p[0]!); }
    if (name === 'rotate') {
      this.count(p,[1,3]); const radians = p[0]!*Math.PI/180, cosine = Math.cos(radians), sine = Math.sin(radians);
      const rotation = new Transform(cosine,sine,-sine,cosine), x = p[1] ?? 0, y = p[2] ?? 0;
      return new Transform(1,0,0,1,x,y).multiply(rotation).multiply(new Transform(1,0,0,1,-x,-y));
    }
    if (name === 'skewX') { this.count(p,[1]); return new Transform(1,0,Math.tan(p[0]!*Math.PI/180),1); }
    if (name === 'skewY') { this.count(p,[1]); return new Transform(1,Math.tan(p[0]!*Math.PI/180),0,1); }
    throw new Error(`unsupported SVG transform: ${name}`);
  }
  private count(parameters: readonly number[], allowed: readonly number[]): void {
    if (!allowed.includes(parameters.length)) throw new Error('invalid SVG transform parameters');
  }
}
