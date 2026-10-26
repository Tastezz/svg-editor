import type { SvgDocument } from '../../domain/model/SvgDocument.js';

export interface DecodedDocument {
  readonly document: SvgDocument;
  readonly warnings: readonly string[];
}

export interface DocumentCodec {
  decode(content: string): DecodedDocument;
  encode(document: SvgDocument): string;
}
