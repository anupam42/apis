import { watch, fire } from './cd.js';
import * as share from './share.js';

export const createTextNode = (text) => document.createTextNode(text);
export const createElement = (tag) => document.createElement(tag);

export function bindText(node, fn) {
  fire(watch(share.currentCD(), fn, (value) => {
    node.textContent = value;
  }));
}

export function bindAttribute(el, name, fn) {
  fire(watch(share.currentCD(), fn, (value) => {
    if (value == null || value === false) el.removeAttribute(name);
    else el.setAttribute(name, value === true ? '' : String(value));
  }));
}

export function addEvent(el, name, handler) {
  el.addEventListener(name, handler);
}
