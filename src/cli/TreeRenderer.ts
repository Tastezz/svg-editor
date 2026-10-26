import type { SvgDocument } from '../domain/model/SvgDocument.js';
import type { Shape } from '../domain/model/Shape.js';

export class TreeRenderer {
  render(document: SvgDocument, id?: string): string {
    const root = id === undefined ? document.root : document.find(id);
    const lines = [id === undefined ? `svg (${document.width}x${document.height})${root.summary.slice(3)}` : root.summary];
    this.append(root,'',lines); return lines.join('\n');
  }
  private append(parent: Shape, prefix: string, lines: string[]): void {
    const children = parent.children;
    children.forEach((child,index) => {
      const last = index === children.length-1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${child.summary}`);
      this.append(child,prefix+(last ? '    ' : '│   '),lines);
    });
  }
}
