import { cdNew, digest } from './cd.js';
import * as share from './share.js';

export * from './cd.js';
export * from './dom.js';

// Wraps a compiled component builder `(option, $cd, $$apply) => rootNode`
// with change-detector setup/teardown. Compiled output calls this once per component.
export function makeComponent(builder) {
  return function(option = {}) {
    const $cd = cdNew(null);
    share.pushCD($cd);
    const $$apply = () => digest($cd);
    let $dom;
    try {
      $dom = builder(option, $cd, $$apply);
    } finally {
      share.popCD();
    }
    return { $dom, $cd, $apply: $$apply };
  };
}

export function mount(target, component, option) {
  const app = component(option);
  target.appendChild(app.$dom);
  return app;
}
