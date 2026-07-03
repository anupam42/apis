import { assert, NotImplemented } from './utils.js';

// Splits a single-file component into its <script> block and template markup.
// <style> is recognized and stripped but not yet processed (see ROADMAP.md).
export function splitComponent(source) {
  let script = '';
  let style = '';
  let template = source;

  const scriptMatch = template.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    script = scriptMatch[1];
    template = template.slice(0, scriptMatch.index) + template.slice(scriptMatch.index + scriptMatch[0].length);
  }

  const styleMatch = template.match(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    style = styleMatch[1];
    template = template.slice(0, styleMatch.index) + template.slice(styleMatch.index + styleMatch[0].length);
  }

  return { script, style, template: template.trim() };
}

// Minimal recursive-descent parser for the template mini-language.
// Supports: plain elements, static/dynamic attributes, @event bindings and
// {expr} text interpolation. `{#if}` / `{#each}` / components are recognized
// as extension points but not implemented yet (thrown as NotImplemented so the
// wiring is visible without pretending the feature works).
export function parseTemplate(source) {
  let i = 0;
  const len = source.length;

  const peek = () => source[i];
  const startsWith = (s) => source.startsWith(s, i);

  function parseNodes(stopTag) {
    const nodes = [];
    while (i < len) {
      if (stopTag && startsWith(`</${stopTag}`)) break;
      if (startsWith('<')) {
        nodes.push(parseElement());
      } else {
        const textNode = parseText();
        if (textNode) nodes.push(textNode);
      }
    }
    return nodes;
  }

  function parseText() {
    const parts = [];
    let buf = '';
    while (i < len && peek() !== '<') {
      if (peek() === '{') {
        if (buf) { parts.push({ type: 'static', value: buf }); buf = ''; }
        parts.push({ type: 'expr', value: readExpr() });
      } else {
        buf += source[i++];
      }
    }
    if (buf) parts.push({ type: 'static', value: buf });
    if (!parts.length) return null;
    if (parts.length === 1 && parts[0].type === 'static') {
      return { type: 'text', static: true, value: parts[0].value };
    }
    return { type: 'text', static: false, parts };
  }

  function readExpr() {
    assert(peek() === '{', 'Expected {');
    i++;
    if (peek() === '#' || peek() === '@' || peek() === ':') {
      throw new NotImplemented(`template block '{${peek()}...}'`);
    }
    let depth = 1;
    let expr = '';
    while (i < len && depth > 0) {
      const c = source[i];
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
      expr += c;
      i++;
    }
    assert(depth === 0, 'Unterminated {expr}');
    return expr.trim();
  }

  function readName() {
    const start = i;
    while (i < len && /[^\s/>=]/.test(source[i])) i++;
    return source.slice(start, i);
  }

  function skipWs() {
    while (i < len && /\s/.test(source[i])) i++;
  }

  function parseAttrs() {
    const attrs = [];
    while (true) {
      skipWs();
      if (i >= len || peek() === '>' || peek() === '/') break;
      const name = readName();
      skipWs();
      if (peek() === '=') {
        i++;
        skipWs();
        if (peek() === '{') {
          attrs.push({ name, dynamic: true, value: readExpr() });
        } else {
          const quote = source[i];
          assert(quote === '"' || quote === "'", `Expected quote for attribute ${name}`);
          i++;
          const start = i;
          while (i < len && source[i] !== quote) i++;
          const value = source.slice(start, i);
          i++;
          attrs.push({ name, dynamic: false, value });
        }
      } else {
        attrs.push({ name, dynamic: false, value: null });
      }
    }
    return attrs;
  }

  function parseElement() {
    assert(peek() === '<', 'Expected <');
    i++;
    const tag = readName();
    if (tag[0] === '#' || tag[0] === ':') throw new NotImplemented(`<${tag}> block`);
    const attributes = parseAttrs();
    skipWs();
    let selfClosing = false;
    if (peek() === '/') { selfClosing = true; i++; }
    assert(peek() === '>', `Expected > closing <${tag}>`);
    i++;

    let children = [];
    if (!selfClosing) {
      children = parseNodes(tag);
      assert(startsWith(`</${tag}`), `Expected closing tag for <${tag}>`);
      while (i < len && source[i] !== '>') i++;
      i++; // consume '>'
    }

    return { type: 'element', tag, attributes, children };
  }

  return parseNodes();
}
