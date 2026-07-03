# apis.js

A compiler-based reactive UI framework: components are written as single files of
HTML-like markup + `<script>` + `<style>`, and compile down to plain JS that builds
DOM directly — no virtual DOM, no runtime framework shipped to the browser.

This is a clean-room implementation. It's architecturally inspired by
[malina.js](https://github.com/malinajs/malinajs) (the compiler → template-AST →
codegen → runtime shape, and the digest-loop reactivity model) but shares no code
with it.

## How it works

```
component source (.html-like)
  │
  ├─ src/parser.js        splitComponent(): pulls out <script>/<style>, leaves template
  │                       parseTemplate(): recursive-descent parser → template AST
  │
  ├─ src/compiler.js      walks the AST, emits a JS module as a string
  │     └─ src/parts/*.js   per-construct codegen (events implemented; if/each/component
  │                         are stubs — see Roadmap)
  │
  └─ src/runtime/*.js     what the emitted code imports and calls at runtime:
        ├─ cd.js            change-detector tree + digest() dirty-checking loop
        ├─ dom.js            DOM primitives: createElement, bindText, bindAttribute, addEvent
        ├─ share.js          tracks the "current" change-detector while building a tree
        └─ index.js          makeComponent() / mount(), barrel export
```

### Reactivity model

Reactivity is **not** compiled per-assignment (no static analysis of `count++` to
figure out what changed). Instead, every `@event` handler compiles to:

```js
$rt.addEvent(el, 'click', ($event) => { inc($event); $$apply(); });
```

`$$apply()` re-runs `digest()`, which walks every registered watcher's getter
function and — if the returned value differs from last time — calls the watcher's
callback (e.g. updates `textContent`, or an attribute). This is the same model
malina.js uses. It means: **reactivity only happens after something the framework
knows about runs** (an event handler for now; timers/promises/etc. would need to
explicitly call `$$apply()` once added).

## Features

### Implemented

- **Component compilation**: single-file components (`<script>` + template, `<style>`
  parsed out but not yet processed — see Roadmap).
- **Text interpolation**: static text, and dynamic `{expr}` interpolation compiled to
  a template literal re-evaluated on every digest (`bindText`).
- **Elements**: arbitrary nested HTML elements built via `document.createElement` /
  `appendChild` (no `innerHTML` templating yet).
- **Attributes**:
  - Static (`disabled`, `class="foo"`)
  - Boolean/valueless (`<input disabled>`)
  - Dynamic (`disabled={isDisabled}`) — bound via `$watch`/`digest`, re-evaluated
    every apply, added/removed via `setAttribute`/`removeAttribute`.
- **Events**: `@event={handler}` and `@event={expression}` (bare identifiers are
  called as `handler($event)`; any other expression is evaluated as a statement
  with `$event` in scope). Every handler triggers `$$apply()` afterward.
- **Change detection runtime**: `ChangeDetector` tree (`cdNew`/`cdAttach`/`cdDetach`),
  `watch`/`fire`/`digest` dirty-checking loop with a 10-iteration stability cap.
- **Mounting**: `makeComponent(builder)` wraps a compiled builder function with
  change-detector setup/teardown; `mount(target, component, option)` appends the
  result into a DOM node.
- **Test harness**: mocha + jsdom, compiling components to a temp `.mjs` file and
  dynamically importing them (`test/basic.test.js`), covering static rendering,
  event-driven reactivity, and dynamic attributes.

### Extension points (stubbed, not implemented)

These exist as real files wired into the parser/compiler so the architecture is
visible, but each currently throws `NotImplemented` (`src/utils.js`):

- `src/parts/if.js` — `{#if}` / `{:else-if}` / `{:else}` blocks. The parser
  recognizes `{#...}` inside `{}` expressions and throws before reaching this file.
- `src/parts/each.js` — `{#each list as item}` loops (no keyed diffing yet either).
- `src/parts/component.js` — child components (`<Foo prop={x} />`), props, slots,
  and parent/child event forwarding.

## TODO / Roadmap

Roughly in the order they'd unblock real apps, grouped by area.

### Templating (highest priority — blocks writing real components)
- [ ] `{#if} / {:else-if} / {:else}` conditional blocks
- [ ] `{#each items as item, index (key)}` loops with keyed reconciliation
- [ ] `{#await promise} / {:then} / {:catch}` async blocks
- [ ] Child components: `<Foo prop={x} @event={handler} />`
- [ ] Slots (default + named) and slot props
- [ ] Two-way bindings (`bind:value`, `bind:checked`, `<select>`/`<input type=radio>` support)
- [ ] `@html` raw HTML output
- [ ] Fragments / multiple template roots without a wrapping element
- [ ] `use:` actions (`element => cleanup` or `{ update, destroy }`)
- [ ] Event modifiers (`@click|stop|prevent`, key modifiers `enter`/`esc`/arrows)
- [ ] Spread props (`{...obj}`) and `$props` / `$attributes` / `$restProps`

### Reactivity & DX
- [ ] Store contract with auto-subscription (`writable`/`readable`/`derived`)
- [ ] `$watch(fn, cb, options)` exposed to component authors, not just internal use
- [ ] `onMount` / `onDestroy` lifecycle hooks
- [ ] `tick()` — resolve after the next digest
- [ ] Reactive statements (`$:`) as compiler sugar over `$watch`
- [ ] Context API (`$context`) for cross-component data without prop drilling
- [ ] Meaningful compiler errors (line/column, source snippet) instead of raw
      `assert()` throws

### Styling
- [ ] Parse and emit `<style>` at all (currently stripped and discarded)
- [ ] Scoped CSS (per-component class/attribute hashing)
- [ ] `:global` escape hatch
- [ ] Passing CSS classes into child components

### Parser/compiler robustness
- [ ] Replace naive brace-counting `{expr}` scanner with one that understands
      strings/template-literals/nested objects containing `{`/`}`
- [ ] Attribute values with expressions mixed into static text (`class="a {b}"`)
- [ ] Self-closing void elements (`<br>`, `<img>`) without requiring `/>`
- [ ] Comments (`<!-- -->`) — currently unhandled by the template parser
- [ ] Real script transform (currently the `<script>` body is copied in verbatim;
      no AST-level import hoisting, `export`s for props, etc.)

### Tooling & ecosystem
- [ ] Bundler plugins (Rollup/esbuild/Vite) so `.component` files can be imported
      directly instead of calling `compile()` by hand
- [ ] Source maps for compiled output
- [ ] CLI (`apis build`, `apis watch`)
- [ ] Syntax highlighting / editor support
- [ ] TypeScript: `<script lang="ts">` support and generated `.d.ts`

### Testing & quality
- [ ] Expand `test/` beyond the 3 current cases as each feature lands
- [ ] Dev-mode warnings (missing `#each` keys, unused CSS, a11y hints)
- [ ] Benchmark harness (bundle size, startup, update performance)

## Test

```
npm install
npm test
```

## License

Not yet decided.
