import { NotImplemented } from '../utils.js';

// Extension point for child-component tags (<Foo prop={x} />), slots and
// props/events plumbing between parent and child components.
export function compileComponentTag() {
  throw new NotImplemented('child components');
}
