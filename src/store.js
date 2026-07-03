// Store contract: any object with `.subscribe(fn)` gets auto-subscribed by the
// compiler's `autoSubscribe` (any lowercase-named import, see src/code.js) —
// subscribing re-runs the component's digest whenever the store notifies.
// Templates read the current value directly off `.value`, they don't unwrap
// via subscription like Svelte's `$store` sugar does.

function makeStore(value, start) {
  const subscribers = new Set();
  let stop = null;

  const notify = () => subscribers.forEach((fn) => fn(value));

  const store = {
    get value() { return value; },
    subscribe(fn) {
      subscribers.add(fn);
      if (subscribers.size == 1 && start) stop = start(set) || null;
      fn(value);
      return () => {
        subscribers.delete(fn);
        if (!subscribers.size && stop) {
          stop();
          stop = null;
        }
      };
    }
  };

  function set(next) {
    if (next === value) return;
    value = next;
    notify();
  }

  function update(fn) {
    set(fn(value));
  }

  return { store, set, update };
}

export function writable(initial, start) {
  const { store, set, update } = makeStore(initial, start);
  store.set = set;
  store.update = update;
  return store;
}

export function readable(initial, start) {
  return makeStore(initial, start).store;
}

export function derived(stores, fn) {
  const single = !Array.isArray(stores);
  const inputs = single ? [stores] : stores;
  const subscribers = new Set();
  let value, inputUnsubs = null;

  const recompute = () => {
    value = single ? fn(inputs[0].value) : fn(inputs.map((s) => s.value));
    subscribers.forEach((fn2) => fn2(value));
  };

  return {
    get value() { return value; },
    subscribe(fn2) {
      const isFirst = !subscribers.size;
      subscribers.add(fn2);
      if (isFirst) inputUnsubs = inputs.map((s) => s.subscribe(recompute));
      else fn2(value);
      return () => {
        subscribers.delete(fn2);
        if (!subscribers.size && inputUnsubs) {
          inputUnsubs.forEach((u) => u());
          inputUnsubs = null;
        }
      };
    }
  };
}
