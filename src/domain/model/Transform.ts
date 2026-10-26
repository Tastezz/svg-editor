/** Immutable SVG affine transform. multiply(right) applies right first. */
export class Transform {
  readonly #values: readonly [number, number, number, number, number, number];

  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    const values = [a, b, c, d, e, f] as const;
    if (!values.every(Number.isFinite)) throw new Error('transform must be finite');
    this.#values = values;
  }

  get values(): readonly [number, number, number, number, number, number] {
    return [...this.#values];
  }

  get isIdentity(): boolean {
    return this.#values.every((value, index) => value === [1, 0, 0, 1, 0, 0][index]);
  }

  multiply(right: Transform): Transform {
    const [a, b, c, d, e, f] = this.#values;
    const [g, h, i, j, k, l] = right.#values;
    return new Transform(a*g+c*h, b*g+d*h, a*i+c*j, b*i+d*j, a*k+c*l+e, b*k+d*l+f);
  }

  inverse(): Transform {
    const [a, b, c, d, e, f] = this.#values;
    const determinant = a*d-b*c;
    if (determinant === 0) throw new Error('cannot edit through a singular transform');
    return new Transform(d/determinant, -b/determinant, -c/determinant, a/determinant,
      (c*f-d*e)/determinant, (b*e-a*f)/determinant);
  }

  point(x: number, y: number): readonly [number, number] {
    const [a, b, c, d, e, f] = this.#values;
    return [a*x+c*y+e, b*x+d*y+f];
  }

  vector(x: number, y: number): readonly [number, number] {
    const [a, b, c, d] = this.#values;
    return [a*x+c*y, b*x+d*y];
  }

  translated(dx: number, dy: number): Transform {
    return new Transform(1, 0, 0, 1, dx, dy).multiply(this);
  }

  scaledTranslation(factor: number): Transform {
    const [a, b, c, d, e, f] = this.#values;
    return new Transform(a, b, c, d, e*factor, f*factor);
  }

  toString(): string {
    return `matrix(${this.#values.map(value => Object.is(value, -0) ? 0 : value).join(' ')})`;
  }
}
