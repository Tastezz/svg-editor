import type { Shape } from '../../domain/model/Shape.js';
import type { ShapeInput } from './ShapeInput.js';

export interface ShapeReader {
  fromSvg(input: ShapeInput): Shape;
}
