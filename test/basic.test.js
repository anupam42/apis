import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { compile } from '../src/compiler.js';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RUNTIME_PATH = path.resolve(import.meta.dirname, '../src/runtime/index.js');

async function compileAndImport(source) {
  const { code } = await compile(source, { runtimeSpecifier: pathToFileURL(RUNTIME_PATH).href });
  const dir = await mkdtemp(path.join(tmpdir(), 'apisjs-'));
  const file = path.join(dir, 'component.mjs');
  await writeFile(file, code);
  return import(pathToFileURL(file).href);
}

describe('compiler + runtime', function() {
  beforeEach(function() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.document = dom.window.document;
  });

  it('renders static text', async function() {
    const { default: Component } = await compileAndImport('<h1>Hello world</h1>');
    const { mount } = await import('../src/runtime/index.js');
    const app = mount(document.body, Component, {});
    assert.equal(document.body.querySelector('h1').textContent, 'Hello world');
    assert.ok(app.$dom);
  });

  it('interpolates and reacts to events via $$apply', async function() {
    const source = `
<script>
  let count = 0;
  function inc() { count++; }
</script>
<button @click={inc}>{count}</button>
`;
    const { default: Component } = await compileAndImport(source);
    const { mount } = await import('../src/runtime/index.js');
    mount(document.body, Component, {});

    const button = document.body.querySelector('button');
    assert.equal(button.textContent, '0');

    button.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    assert.equal(button.textContent, '1');

    button.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    assert.equal(button.textContent, '2');
  });

  it('binds dynamic attributes', async function() {
    const source = `
<script>
  let disabled = true;
</script>
<button disabled={disabled}>go</button>
`;
    const { default: Component } = await compileAndImport(source);
    const { mount } = await import('../src/runtime/index.js');
    mount(document.body, Component, {});
    assert.equal(document.body.querySelector('button').getAttribute('disabled'), '');
  });
});
