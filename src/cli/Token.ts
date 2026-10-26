export class Token {
  constructor(private readonly content: string, private readonly inQuotes: boolean) {}
  get value(): string { return this.content; }
  get quoted(): boolean { return this.inQuotes; }
}
