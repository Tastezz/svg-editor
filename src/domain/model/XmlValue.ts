/** XML 1.0 Char production, checked before an edit reaches persistent SVG. */
export class XmlValue {
  static validate(value: string): string {
    for (const character of value) {
      const code = character.codePointAt(0)!;
      const valid = code === 9 || code === 10 || code === 13 ||
        (code >= 0x20 && code <= 0xD7FF) || (code >= 0xE000 && code <= 0xFFFD) ||
        (code >= 0x10000 && code <= 0x10FFFF);
      if (!valid) throw new Error('invalid XML character');
    }
    return value;
  }
}
