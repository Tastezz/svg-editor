import type { Shape } from '../domain/model/Shape.js';

export class ShowRenderer {
  render(shape: Shape): string {
    const lines = [`${shape.label}  parent=${shape.parent?.label ?? 'none'}`];
    const attributes = Object.entries(shape.attributes).filter(([name])=>name !== 'id');
    for (const [name,value] of attributes) lines.push(`  ${name}=${JSON.stringify(value)}`);
    if (shape.textContent !== null) lines.push(`  text=${JSON.stringify(shape.textContent)}`);
    return lines.join('\n');
  }
}
