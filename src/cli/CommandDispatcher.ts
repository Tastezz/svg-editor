import type { EditorSession } from '../application/EditorSession.js';
import type { ShapeFactory } from '../application/factories/ShapeFactory.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { FrontCommand } from '../application/commands/FrontCommand.js';
import { BackCommand } from '../application/commands/BackCommand.js';
import { Tokenizer } from './Tokenizer.js';
import { CommandArguments } from './CommandArguments.js';
import { TreeRenderer } from './TreeRenderer.js';
import { ShowRenderer } from './ShowRenderer.js';

interface CommandDefinition {
  readonly syntax: string;
  readonly document: boolean;
  readonly run: (args: CommandArguments) => string | Promise<string>;
}

/** D1: command-name dispatch lives only in this registry. */
export class CommandDispatcher {
  readonly #tokenizer = new Tokenizer();
  readonly #tree = new TreeRenderer();
  readonly #show = new ShowRenderer();
  readonly #definitions: ReadonlyMap<string,CommandDefinition>;

  constructor(private readonly session: EditorSession, private readonly factory: ShapeFactory) {
    this.#definitions = new Map<string,CommandDefinition>([
      ['init',{syntax:'init [w] [h]',document:false,run:a=>{
        a.count(0,2); return session.init(a.length ? a.number(0) : 800,a.length>1 ? a.number(1) : 600);
      }}],
      ['read',{syntax:'read <file.svg>',document:false,run:a=>{a.count(1);return session.read(a.string(0));}}],
      ['save',{syntax:'save [file.svg]',document:true,run:a=>{a.count(0,1);return session.save(a.values[0]);}}],
      ['canvas',{syntax:'canvas [w h]',document:true,run:a=>{
        a.count(0,2); if (a.length===1) throw new Error('usage: canvas [w h]');
        return a.length ? session.canvas(a.number(0),a.number(1)) : session.canvas();
      }}],
      ['create',{syntax:'create <type> <id> [params...] [in <containerId>]',document:true,run:a=>this.create(a)}],
      ['delete',{syntax:'delete <id>',document:true,run:a=>{a.count(1);return session.execute(new DeleteCommand(a.string(0)));}}],
      ['move',{syntax:'move <id> <dx> <dy>',document:true,run:a=>{a.count(3);return session.execute(new MoveCommand(a.string(0),a.number(1),a.number(2)));}}],
      ['scale',{syntax:'scale <id> <factor>',document:true,run:a=>{a.count(2);return session.execute(new ScaleCommand(a.string(0),a.number(1)));}}],
      ['set',{syntax:'set <id> <attr> <value>',document:true,run:a=>{a.count(3);return session.execute(new SetCommand(a.string(0),a.string(1),a.string(2)));}}],
      ['group',{syntax:'group <newGid> <id1> <id2>...',document:true,run:a=>{a.count(3,Infinity);return session.execute(new GroupCommand(a.string(0),a.values.slice(1)));}}],
      ['ungroup',{syntax:'ungroup <gid>',document:true,run:a=>{a.count(1);return session.execute(new UngroupCommand(a.string(0)));}}],
      ['addto',{syntax:'addto <gid> <id>',document:true,run:a=>{a.count(2);return session.execute(new AddToCommand(a.string(0),a.string(1)));}}],
      ['front',{syntax:'front <id>',document:true,run:a=>{a.count(1);return session.execute(new FrontCommand(a.string(0)));}}],
      ['back',{syntax:'back <id>',document:true,run:a=>{a.count(1);return session.execute(new BackCommand(a.string(0)));}}],
      ['tree',{syntax:'tree [id]',document:true,run:a=>{a.count(0,1);return this.#tree.render(session.document,a.values[0]);}}],
      ['show',{syntax:'show <id>',document:true,run:a=>{a.count(1);return this.#show.render(session.document.find(a.string(0)));}}],
      ['help',{syntax:'help',document:false,run:a=>{a.count(0);return this.help();}}],
      ['undo',{syntax:'undo',document:true,run:a=>{a.count(0);return session.undo();}}],
      ['redo',{syntax:'redo',document:true,run:a=>{a.count(0);return session.redo();}}],
    ]);
  }

  async dispatch(line: string): Promise<string | null> {
    const tokens = this.#tokenizer.tokenize(line);
    if (!tokens.length) return null;
    const name = tokens[0]!.value, definition = this.#definitions.get(name);
    if (!definition) throw new Error(`unknown command: ${name}`);
    if (definition.document) void this.session.document;
    return definition.run(new CommandArguments(tokens.slice(1),definition.syntax));
  }

  private create(args: CommandArguments): string {
    args.count(2,Infinity);
    const tokens = args.tokens, inToken = tokens.at(-2);
    const hasParent = inToken?.value === 'in' && !inToken.quoted;
    const values = (hasParent ? tokens.slice(0,-2) : tokens).map(token=>token.value);
    if (values.length<2) throw new Error('usage: create <type> <id> [params...] [in <containerId>]');
    const parent = hasParent ? tokens.at(-1)!.value : undefined;
    return this.session.execute(new CreateCommand(this.factory,values[0]!,values[1]!,values.slice(2),parent));
  }

  private help(): string {
    return [...this.#definitions.values()].map(definition=>definition.syntax).join('\n')+
      '\nTypes: rect x y w h [fill]; circle cx cy r [fill]; ellipse cx cy rx ry [fill]; line x1 y1 x2 y2 [stroke]; text x y "content"; g\nUse Ctrl-D / EOF to finish. Lines beginning with # are comments.';
  }
}
