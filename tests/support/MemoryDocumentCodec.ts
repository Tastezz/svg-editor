import type { DecodedDocument, DocumentCodec } from '../../src/application/ports/DocumentCodec.js';
import type { SvgDocument } from '../../src/domain/model/SvgDocument.js';

export class MemoryDocumentCodec implements DocumentCodec {
  readonly #documents = new Map<string,DecodedDocument>();
  #sequence = 0;
  seed(key: string, document: SvgDocument, warnings: readonly string[] = []): void {
    this.#documents.set(key,{document:document.clone(),warnings:[...warnings]});
  }
  decode(content: string): DecodedDocument {
    const result = this.#documents.get(content);
    if (!result) throw new Error('invalid SVG');
    return {document:result.document.clone(),warnings:[...result.warnings]};
  }
  encode(document: SvgDocument): string {
    const key = `memory-payload-${++this.#sequence}`; this.seed(key,document); return key;
  }
}
