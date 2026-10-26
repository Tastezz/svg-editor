import type { Transform } from '../../domain/model/Transform.js';

export interface ShapeInput {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string | null;
  readonly children: readonly ShapeInput[];
  readonly transform: Transform;
}
