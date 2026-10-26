import { Numeric } from '../domain/model/Numeric.js';
import type { Token } from './Token.js';

export class CommandArguments {
  constructor(private readonly input: readonly Token[], private readonly syntax: string) {}
  get length(): number { return this.input.length; }
  get tokens(): readonly Token[] { return [...this.input]; }
  get values(): readonly string[] { return this.input.map(token => token.value); }
  string(index: number): string {
    const token = this.input[index];
    if (!token) throw new Error(`usage: ${this.syntax}`);
    return token.value;
  }
  number(index: number): number { return Numeric.parse(this.string(index)); }
  count(minimum: number, maximum = minimum): void {
    if (this.length < minimum || this.length > maximum) throw new Error(`usage: ${this.syntax}`);
  }
}
