import { EditorSession } from './application/EditorSession.js';
import { ShapeFactory } from './application/factories/ShapeFactory.js';
import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { Repl } from './cli/Repl.js';
import { FileDocumentStore } from './infrastructure/fs/FileDocumentStore.js';
import { SvgCodec } from './infrastructure/svg/SvgCodec.js';

const factory = new ShapeFactory();
const session = new EditorSession(new FileDocumentStore(),new SvgCodec(factory));
await new Repl(new CommandDispatcher(session,factory),process.stdin,process.stdout,process.stderr,
  Boolean(process.stdin.isTTY && process.stdout.isTTY)).run().catch(error=>{
    process.stderr.write(`error: ${String(error instanceof Error ? error.message : error).replace(/[\r\n]+/g,' ')}\n`);
    process.exitCode = 1;
  });
