import { NotImplemented } from '../utils.js';

// Extension point for `{#if}/{:else-if}/{:else}` blocks.
// The parser currently throws before reaching here (see parser.js readExpr) —
// this stub exists so compiler.js has a stable place to wire it up once the
// parser learns the block syntax.
export function compileIfBlock() {
  throw new NotImplemented('#if block');
}
