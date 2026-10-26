import { Token } from './Token.js';

export class Tokenizer {
  tokenize(line: string): readonly Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/.test(line[index]!)) { index++; continue; }
      const start = index;
      if (line[index] === '"') {
        index++;
        let closed = false;
        while (index < line.length) {
          if (line[index] === '\\') { index += 2; continue; }
          if (line[index] === '"') { index++; closed = true; break; }
          index++;
        }
        if (!closed) throw new Error('unterminated quoted argument');
        if (index < line.length && !/\s/.test(line[index]!)) throw new Error('arguments must be separated by whitespace');
        let value: unknown;
        try { value = JSON.parse(line.slice(start,index)); }
        catch { throw new Error('invalid quoted argument'); }
        if (typeof value !== 'string') throw new Error('invalid quoted argument');
        tokens.push(new Token(value,true));
      } else {
        while (index < line.length && !/\s/.test(line[index]!)) {
          if (line[index] === '"') throw new Error('quote must start an argument');
          index++;
        }
        tokens.push(new Token(line.slice(start,index),false));
      }
    }
    return tokens;
  }
}
