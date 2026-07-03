// Change detection: a dirty-checking digest loop, same model as malina's cd.js.
// Reactivity isn't compiled per-assignment; instead every event handler ends by
// calling $$apply(), which re-runs all watcher getters and fires callbacks whose
// value changed.

export function ChangeDetector(parent) {
  this.parent = parent || null;
  this.children = [];
  this.watchers = [];
}

export function cdNew(parent) {
  return new ChangeDetector(parent);
}

export function cdAttach(parent, cd) {
  cd.parent = parent;
  parent.children.push(cd);
}

export function cdDetach(cd) {
  if (!cd.parent) return;
  const i = cd.parent.children.indexOf(cd);
  if (i >= 0) cd.parent.children.splice(i, 1);
}

export function watch(cd, fn, cb) {
  const w = { fn, cb, value: undefined, init: false };
  cd.watchers.push(w);
  return w;
}

export function fire(w) {
  w.value = w.fn();
  w.init = true;
  w.cb(w.value);
  return w.value;
}

export function digest(rootCD) {
  const MAX_LOOPS = 10;
  let loop = 0;
  let changed = true;

  const walk = (cd) => {
    for (const w of cd.watchers) {
      const value = w.fn();
      if (!w.init || value !== w.value) {
        w.init = true;
        w.value = value;
        w.cb(value);
        changed = true;
      }
    }
    for (const child of cd.children) walk(child);
  };

  while (changed && loop++ < MAX_LOOPS) {
    changed = false;
    walk(rootCD);
  }
  if (loop >= MAX_LOOPS) {
    // eslint-disable-next-line no-console
    console.warn('apis.js: digest did not stabilize after', MAX_LOOPS, 'loops');
  }
}
