/**
 * ISC License
 *
 * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */
class Dommy {
  constructor() {
    this.reset();
    this.lastElementChild = new Nody(this, '<!--$-->');
    this._childNodes = [this.lastElementChild];
  }
  get childNodes() {
    return this._childNodes.slice(0, -1);
  }
  get firstChild() {
    return this.childNodes[0];
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length-1];
  }
  get textContent() {
    return this.childNodes.map(node => node.value).join('');
  }
  set textContent(value) {
    if (!value) {
      this.reset();
      this._childNodes = [this.lastElementChild];
    }
  }
  insertBefore(newNode, liveNode) {
    if (!liveNode) liveNode = this.lastElementChild;
    this.operations.push(`insertBefore(${newNode.value}, ${liveNode.value})`);
    if (newNode === liveNode) return;
    this._removeChild(newNode);
    const index = this._childNodes.indexOf(liveNode);
    if (index < 0)
      throw new Error('invalid insertBefore');
    this._childNodes.splice(index, 0, newNode);
  }
  appendChild(newNode) {
    this.insertBefore(newNode);
    return newNode;
  }
  replaceChild(newNode, oldNode) {
    this.operations.push(`replaceChild(${newNode.value}, ${oldNode.value})`);
    this._removeChild(newNode);
    const index = this.childNodes.indexOf(oldNode);
    if (index < 0)
      throw new Error('invalid replaceChild');
    this._childNodes.splice(index, 1, newNode);
  }
  removeChild(node) {
    this.operations.push(`removeChild(${node.value})`);
    const index = this.childNodes.indexOf(node);
    if (index < 0)
      throw new Error('invalid removeChild');
    this._childNodes.splice(index, 1);
  }
  count() {
    return this.operations.length;
  }
  reset() {
    this.operations = [];
  }
  _removeChild(node) {
    // use childNodes instead of _childNodes
    // to preserve lastElementChild
    const index = this.childNodes.indexOf(node);
    if (-1 < index)
      this._childNodes.splice(index, 1);
  }
}

class Nody {
  constructor(dommy, value) {
    this.dommy = dommy;
    this.value = value;
  }
  get nextSibling() {
    const {childNodes, lastElementChild} = this.dommy;
    const index = childNodes.indexOf(this) + 1;
    return index < childNodes.length ? childNodes[index] : lastElementChild;
  }
  get previousSibling() {
    const {_childNodes} = this.dommy;
    const index = _childNodes.indexOf(this) - 1;
    return index >= 0 ? _childNodes[index] : null;
  }
}

export {Dommy, Nody};
