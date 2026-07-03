export function assert(cond, message) {
  if (!cond) throw new Error(message || 'Assertion failed');
}

export class NotImplemented extends Error {
  constructor(feature) {
    super(`'${feature}' is not implemented yet (see ROADMAP.md)`);
  }
}

let uid = 0;
export function nextId(prefix = '$el') {
  return `${prefix}${uid++}`;
}
export function resetIds() {
  uid = 0;
}
