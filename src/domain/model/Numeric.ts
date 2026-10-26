export class Numeric {
  static finite(value: number): number {
    if (!Number.isFinite(value)) throw new Error('number must be finite');
    return value;
  }

  static nonnegative(value: number): number {
    Numeric.finite(value);
    if (value < 0) throw new Error('size must not be negative');
    return value;
  }

  static positive(value: number): number {
    Numeric.finite(value);
    if (value <= 0) throw new Error('size must be positive');
    return value;
  }

  static parse(text: string): number {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
      throw new Error(`invalid number: ${text}`);
    }
    return Numeric.finite(Number(text));
  }

  static format(value: number): string {
    Numeric.finite(value);
    return String(Object.is(value, -0) ? 0 : value);
  }
}
