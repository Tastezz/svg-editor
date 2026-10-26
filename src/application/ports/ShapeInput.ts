import type { Transform } from '../../domain/model/Transform.js';

/** Neutral input contract consumed by shape construction and document adapters. */
export interface ShapeInput {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string | null;
  readonly children: readonly ShapeInput[];
  readonly transform: Transform;
}
