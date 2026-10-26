import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CommandDispatcher } from './CommandDispatcher.js';

export class Repl {
  constructor(private readonly dispatcher: CommandDispatcher, private readonly input: Readable,
    private readonly output: Writable, private readonly errors: Writable, private readonly interactive: boolean) {}

  async run(): Promise<void> {
    const reader = createInterface({input:this.input,terminal:false,crlfDelay:Infinity});
    this.output.write("svg-editor 0.1 — type 'help' for commands\n");
    if (this.interactive) this.output.write('svg> ');
    try {
      for await (const line of reader) {
        try {
          const result = await this.dispatcher.dispatch(line);
          if (result !== null) this.output.write(`${result}\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.errors.write(`error: ${message.replace(/[\r\n]+/g,' ')}\n`);
        }
        if (this.interactive) this.output.write('svg> ');
      }
    } finally { reader.close(); }
  }
}
