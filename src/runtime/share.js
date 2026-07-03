// Tracks which change-detector is "active" while a component tree is being built,
// so runtime helpers (bindText, bindAttribute, ...) know where to register watchers.
const stack = [];

export function pushCD(cd) {
  stack.push(cd);
}

export function popCD() {
  stack.pop();
}

export function currentCD() {
  return stack[stack.length - 1];
}
