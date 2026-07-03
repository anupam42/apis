// Compiles an @event attribute into a runtime.addEvent(...) call.
// Reactivity here is triggered the same way malina does it: the handler runs,
// then $$apply() re-runs the digest loop so any bindings whose source data
// changed get refreshed. There is no compile-time tracking of assignments.
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export function compileEvent(elVar, attr, block) {
  const event = attr.name.slice(1); // strip '@'
  const value = attr.value.trim();
  // Bare identifier (`@click={onClick}` or `@click=onClick`) is a handler
  // reference and gets called with $event; anything else is an inline
  // expression/statement evaluated with $event in scope (`@click={count++}`).
  const call = IDENTIFIER.test(value) ? `${value}($event);` : `${value};`;
  block.push(`$rt.addEvent(${elVar}, ${JSON.stringify(event)}, ($event) => { ${call} $$apply(); });`);
}
