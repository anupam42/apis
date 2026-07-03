// Minimal code builder. Malina's xnode.js solves out-of-order dependency
// resolution (a node can need something declared later); we don't need that
// yet since v0 always compiles script-then-template in a fixed order, so this
// is a plain indented-line accumulator. Swap for a dependency-graph builder if
// a later feature (e.g. hoisted templates) needs out-of-order emission.
export class Block {
  constructor() {
    this.lines = [];
  }

  push(line) {
    this.lines.push(line);
    return this;
  }

  render(indent = 1) {
    const pad = '  '.repeat(indent);
    return this.lines.map((l) => pad + l).join('\n');
  }
}
