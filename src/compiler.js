import { splitComponent, parseTemplate } from './parser.js';
import { Block } from './codegen.js';
import { nextId, resetIds } from './utils.js';
import { compileEvent } from './parts/event.js';

const RUNTIME_SPECIFIER = 'apis/runtime';

export async function compile(source, config = {}) {
  const runtimeSpecifier = config.runtimeSpecifier || RUNTIME_SPECIFIER;
  resetIds();

  const { script, template } = splitComponent(source);
  const ast = parseTemplate(template);

  const block = new Block();
  const rootVar = nextId('$root');
  block.push(`const ${rootVar} = document.createDocumentFragment();`);

  for (const node of ast) {
    const varName = compileNode(node, block);
    if (varName) block.push(`${rootVar}.appendChild(${varName});`);
  }

  const code = `import * as $rt from ${JSON.stringify(runtimeSpecifier)};

export default $rt.makeComponent(($option, $cd, $$apply) => {
${indentScript(script)}
${block.render()}
  return ${rootVar};
});
`;

  return { code };
}

function indentScript(script) {
  return script
    .split('\n')
    .map((l) => (l.trim() ? `  ${l}` : l))
    .join('\n');
}

function compileNode(node, block) {
  if (node.type === 'text') return compileText(node, block);
  if (node.type === 'element') return compileElement(node, block);
  throw new Error(`Unknown node type: ${node.type}`);
}

function compileText(node, block) {
  const varName = nextId('$text');
  if (node.static) {
    block.push(`const ${varName} = $rt.createTextNode(${JSON.stringify(node.value)});`);
    return varName;
  }
  const template = node.parts
    .map((p) => (p.type === 'static' ? escapeForTemplate(p.value) : `\${${p.value}}`))
    .join('');
  block.push(`const ${varName} = $rt.createTextNode('');`);
  block.push(`$rt.bindText(${varName}, () => \`${template}\`);`);
  return varName;
}

function escapeForTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function compileElement(node, block) {
  const varName = nextId('$el');
  block.push(`const ${varName} = $rt.createElement(${JSON.stringify(node.tag)});`);

  for (const attr of node.attributes) {
    if (attr.name.startsWith('@')) {
      compileEvent(varName, attr, block);
    } else if (attr.dynamic) {
      block.push(`$rt.bindAttribute(${varName}, ${JSON.stringify(attr.name)}, () => (${attr.value}));`);
    } else if (attr.value === null) {
      block.push(`${varName}.setAttribute(${JSON.stringify(attr.name)}, '');`);
    } else {
      block.push(`${varName}.setAttribute(${JSON.stringify(attr.name)}, ${JSON.stringify(attr.value)});`);
    }
  }

  for (const child of node.children) {
    const childVar = compileNode(child, block);
    if (childVar) block.push(`${varName}.appendChild(${childVar});`);
  }

  return varName;
}
