import * as share from '../runtime/share.js';

// Falls back to a timer for environments without requestAnimationFrame (e.g. jsdom).
const raf = typeof requestAnimationFrame == 'function'
  ? requestAnimationFrame
  : (fn) => setTimeout(() => fn(Date.now()), 16);

function applyCss(el, cssText) {
  if (!cssText) return;
  cssText.split(';').forEach((rule) => {
    const i = rule.indexOf(':');
    if (i < 0) return;
    const prop = rule.slice(0, i).trim();
    const value = rule.slice(i + 1).trim();
    if (prop) el.style.setProperty(prop, value);
  });
}

let tokenCounter = 0;

// Runs one transition to completion and resolves. If another transition starts
// on the same element before this one finishes, this one abandons its frame
// loop (checked via a token) instead of fighting over styles.
function run(el, config, direction) {
  config = config || {};
  const duration = config.duration ?? 300;
  const delay = config.delay ?? 0;
  const easing = config.easing || ((t) => t);
  const token = ++tokenCounter;
  el.__transitionToken = token;

  return new Promise((resolve) => {
    const begin = () => {
      const startTime = Date.now();
      const step = () => {
        if (el.__transitionToken !== token) return resolve();
        const elapsed = Date.now() - startTime;
        const done = elapsed >= duration;
        const p = done ? 1 : easing(elapsed / duration);
        const t = direction == 'in' ? p : 1 - p;
        if (config.css) applyCss(el, config.css(t, 1 - t));
        config.tick?.(t, 1 - t);
        if (done) resolve();
        else raf(step);
      };
      raf(step);
    };
    if (delay) setTimeout(begin, delay);
    else begin();
  });
}

// Wires a transition/in/out directive to the block lifecycle: `in`/`transition`
// play on $onMount, `out`/`transition` play on $onDestroy. Returning the
// outro promise from the $onDestroy callback is what makes if/each blocks wait
// for it before actually removing the DOM node (see share.destroyResults).
export function bindTransition(el, transitionFn, getParams, kind) {
  if (kind != 'out') {
    share.$onMount(() => {
      run(el, transitionFn(el, getParams ? getParams() : undefined), 'in');
    });
  }
  if (kind != 'in') {
    share.$onDestroy(() => run(el, transitionFn(el, getParams ? getParams() : undefined), 'out'));
  }
}

export function fade(node, { delay = 0, duration = 300, easing } = {}) {
  return { delay, duration, easing, css: (t) => `opacity: ${t}` };
}

export function fly(node, { delay = 0, duration = 300, easing, x = 0, y = 0, opacity = 0 } = {}) {
  return {
    delay,
    duration,
    easing,
    css: (t) => `transform: translate(${(1 - t) * x}px, ${(1 - t) * y}px); opacity: ${opacity + t * (1 - opacity)};`
  };
}

export function scale(node, { delay = 0, duration = 300, easing, start = 0, opacity = 0 } = {}) {
  return {
    delay,
    duration,
    easing,
    css: (t) => `transform: scale(${start + t * (1 - start)}); opacity: ${opacity + t * (1 - opacity)};`
  };
}

export function slide(node, { delay = 0, duration = 300, easing, axis = 'y' } = {}) {
  const dim = axis == 'x' ? 'width' : 'height';
  const size = axis == 'x' ? node.scrollWidth : node.scrollHeight;
  return {
    delay,
    duration,
    easing,
    css: (t) => `overflow: hidden; ${dim}: ${t * size}px;`
  };
}
