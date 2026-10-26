/** Read-only transport description, not the editable domain model. */
export interface ShapeElement {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string | null;
  readonly children: readonly ShapeElement[];
}
