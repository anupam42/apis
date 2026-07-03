
# Apis.js

Apis.js helps you create a fast and thin web application that runs **without a front-end framework**
* High performance
* One of the best in startup metrics
* Compact bundle size of an app (starts from 185 bytes)
* Familiar syntax based of standard HTML, CSS and JavaScript

## Example

```html
<script>
  let name = 'world';
    
  function rename() {
    name = 'user';
  }
</script>

<h1>Hello {name.toUpperCase()}!</h1>
<button @click={rename}>Rename</button>
```

## How it works

Apis.js is a compiler. `src/main.js` exposes `compile(source, config)`, which runs a
component's `.html`-style source through a pipeline and returns a plain JS module string:

```
source
  │
  ├─ src/parser.js          parseHTML(): markup → DOM-ish AST; parseText(): {expr} interpolation
  ├─ src/compact.js          collapses whitespace-only text nodes
  ├─ src/code.js              parses the <script> block (acorn) and detects root
  │                          variables/functions, imports, reactive (`$:`) statements
  ├─ src/css/index.js        scopes <style> CSS to the component
  ├─ src/xnode.js             dependency-resolving code builder (xNode/xBuild) — nodes
  │                          declare what they `$wait` on / `$hold`, and building
  │                          resolves in the right order regardless of declaration order
  ├─ src/builder.js           walks the template AST, emitting xNodes for each construct
  │     └─ src/parts/*.js     one file per construct: if, each, await, html, component,
  │                          slot, fragment, head, portal, keep-alive, prop, radio, select
  ├─ src/event-prop.js        compiles `@event` bindings + modifiers (stop/prevent/keys)
  └─ src/runtime/*.js         what the emitted code imports at runtime:
        ├─ cd.js               change-detector tree + $digest() dirty-checking loop
        ├─ base.js              DOM primitives, makeComponent/mount, dynamic components,
        │                      slots, actions, class/style bindings, spread props
        ├─ share.js             current-component/current-cd context plumbing
        └─ index.js             barrel export consumed as `apisjs/runtime.js`
```

Distribution entry points:
- `apis.js` / `apis.mjs` — the compiler, built via `rollup -c` (see `rollup.config.js`)
- `apis-rollup.js` — Rollup plugin wrapping the compiler for `.html`/component imports
- `apis-esbuild.js` — esbuild plugin doing the same
- `runtime.js` — the runtime bundle every compiled component imports
- `plugins/sass.js`, `plugins/static-text.js` — optional compiler plugins (hook into
  `dom:before`/`css:before`/etc. lifecycle hooks in `compiler.js`)

### Reactivity model

Reactivity is assignment-driven but resolved via a **digest loop**, not static
per-assignment analysis: every `@event` handler is compiled to call the local handler
and then `$$apply()`, e.g.

```js
$runtime.addEvent(el, 'click', ($event) => { rename(); $$apply(); });
```

`$$apply()` schedules a microtask that runs `$digest($cd)`, walking the change-detector
tree and re-evaluating every registered watcher's getter (`$watch(fn, cb)`); a changed
value fires the callback (DOM update, prop push to a child component, store write, etc.).

## Features

### Reactivity
* Assignment-driven reactivity (`name = 'user'`) — no virtual DOM, no proxies
* Reactive statements with `$:`
* Explicit watchers: `$watch(fn, callback, lvl)`
* `immutable` option and deep checking (`prop|deep`, `deepCheckingProps`)
* Stores with autosubscription (`!no-autosubscribe` to opt out)

### Template blocks
* Conditionals: `#if`, `:else`, `:else-if`
* Loops: `#each` with index, destructuring, `key`/`auto` key, and `each-else`
* Async: `#await` / `:then` / `:catch`
* `@html` raw HTML output
* Fragments, exported fragments (inverted slots)
* Slots, named slots, fragment slots
* Dynamic components and `apis:self`
* `<apis:head>`, `<apis:body>`, `<apis:window>`
* Portals (`<apis:portal>`)
* `keep-alive` blocks

### Bindings, events & directives
* Event shortcuts (`@click`) and forwarding (`@@click`, forward all `@@`)
* Manual delegation `@click|root`
* Event modifiers: `stop`, `prevent`, `ctrl`, `alt`, `shift`, `meta`
* Key events: `enter`, `tab`, `esc`, `space`, arrow keys, `delete`
* Two-way bindings, incl. `radio`, `select`, `range`/`number` (value as number)
* Actions (`use:`), inline actions, actions returning a destroy function
* Spread props and objects `{...obj}`
* `$props`, `$attributes`, `$restProps`
* `export const` constant props, `export function`
* Context API (`$context`)
* Autoimport

### Styling
* Scoped CSS by default
* `:global` selectors and `global` style attribute
* Compound classes and passing CSS classes to child components
* External classes (`$className`)
* `style:` templates (e.g. `style:color={color}`)

### Lifecycle
* `onMount`, `onDestroy`, `$onMount`, `$onDestroy`
* `onError`, `tick`

### Tooling
* Rollup plugin (`apis-rollup.js`)
* esbuild plugin (`apis-esbuild.js`)
* sass/scss and static-text plugins
* Compiler plugin hooks: `dom:before`, `dom`, `dom:check`, `dom:compact`, `dom:after`,
  `js:before`, `js`, `js:after`, `css:before`, `css`, `runtime:before`, `runtime`,
  `build:before`, `build` (see `hook()` in `src/main.js`)

## TODO / Roadmap

### Animation & transitions
- [ ] First-class `transition:` / `in:` / `out:` directives with a built-in library (fade, fly, slide, scale)
- [ ] `animate:` directive for FLIP list reordering in `#each`

### Reactivity & DX
- [ ] Optional fine-grained signals to reduce dirty-checking overhead
- [ ] Official store library (`writable` / `readable` / `derived`)
- [ ] Improved async batching around `tick()`
- [ ] `$effect` / `$derived` runes-style primitives as an ergonomic alternative to `$:`
- [ ] `$inspect` debugging helper to log reactive value changes in dev mode
- [ ] Deep reactivity for nested objects/arrays without manual reassignment

### Templating
- [ ] `{#key}` block (re-create on key change)
- [ ] `{@const}` local template constants and `{@debug}`
- [ ] `bind:group` and consistent `bind:this` refs
- [ ] `{@html}` sanitization option / trusted-HTML helper
- [ ] Snippets / reusable template fragments (`{#snippet}` + `{@render}`)
- [ ] `{#each ... as ... (key)}` with explicit keyed diffing helpers

### Bindings, events & directives
- [ ] `bind:` for element dimensions (`clientWidth`, `clientHeight`, `contentRect`)
- [ ] `use:` action typing and lifecycle `update` hook
- [ ] Custom event modifiers and modifier composition

### Tooling & ecosystem
- [ ] **TypeScript support** in `<script lang="ts">` with generated component `.d.ts` types
- [ ] **SSR / hydration** and a meta-framework (routing, SSG, islands)
- [ ] Vite plugin
- [ ] Language server for VS Code (diagnostics, go-to-definition)
- [ ] Source maps for compiled output
- [ ] Official Prettier plugin for `.html`/component formatting
- [ ] Webpack loader and Astro integration
- [ ] Playground / REPL with shareable links
- [ ] Bundle-size analysis output in the compiler
- [ ] HMR (hot module replacement) improvements with state preservation

### Testing & quality
- [ ] Component testing utilities / Testing Library adapter
- [ ] Dev-mode warnings (a11y hints, unused CSS, missing `#each` keys)
- [ ] Grow `test/` coverage alongside `test/run.js` as features land

### Performance
- [ ] Compile-time static subtree hoisting
- [ ] Optional partial hydration / islands for SSR output
- [ ] Tree-shakable runtime helpers

## Build & test

```
npm install
npm run build   # rollup -c -> apis.js / apis.mjs / runtime.js
npm test        # mocha ./test/run.js
```

## License

[MIT](LICENSE)
