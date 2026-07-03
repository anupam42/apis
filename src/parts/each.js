import { NotImplemented } from '../utils.js';

// Extension point for `{#each list as item}` blocks. See parts/if.js for why
// this is a stub: the parser rejects `{#...}` before compilation reaches here.
export function compileEachBlock() {
  throw new NotImplemented('#each block');
}
