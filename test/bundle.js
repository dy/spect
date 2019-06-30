~function(global) {
  const Pax = {}
  Pax.baseRequire = typeof require !== "undefined" ? require : n => {
    throw new Error(`Could not resolve module name: ${n}`)
  }
  Pax.modules = {}
  Pax.files = {}
  Pax.mains = {}
  Pax.resolve = (base, then) => {
    base = base.split('/')
    base.shift()
    for (const p of then.split('/')) {
      if (p === '..') base.pop()
      else if (p !== '.') base.push(p)
    }
    return '/' + base.join('/')
  }
  Pax.Module = function Module(filename, parent) {
    this.filename = filename
    this.id = filename
    this.loaded = false
    this.parent = parent
    this.children = []
    this.exports = {}
  }
  Pax.makeRequire = self => {
    const require = m => require._module(m).exports
    require._deps = {}
    require.main = self

    require._esModule = m => {
      const mod = require._module(m)
      return mod.exports.__esModule ? mod.exports : {
        get default() {return mod.exports},
      }
    }
    require._module = m => {
      let fn = self ? require._deps[m] : Pax.main
      if (fn == null) {
        const module = {exports: Pax.baseRequire(m)}
        require._deps[m] = {module: module}
        return module
      }
      if (fn.module) return fn.module
      const module = new Pax.Module(fn.filename, self)
      fn.module = module
      module.require = Pax.makeRequire(module)
      module.require._deps = fn.deps
      module.require.main = self ? self.require.main : module
      if (self) self.children.push(module)
      fn(module, module.exports, module.require, fn.filename, fn.filename.split('/').slice(0, -1).join('/'), {url: 'file://' + (fn.filename.charAt(0) === '/' ? '' : '/') + fn.filename})
      module.loaded = true
      return module
    }
    return require
  }

  Pax.files["C:/projects/spect/node_modules/tape-modern/dist/tape-modern.umd.js"] = file_C$3a$5cprojects$5cspect$5cnode_modules$5ctape$2dmodern$5cdist$5ctape$2dmodern$2eumd$2ejs; file_C$3a$5cprojects$5cspect$5cnode_modules$5ctape$2dmodern$5cdist$5ctape$2dmodern$2eumd$2ejs.deps = {}; file_C$3a$5cprojects$5cspect$5cnode_modules$5ctape$2dmodern$5cdist$5ctape$2dmodern$2eumd$2ejs.filename = "C:/projects/spect/node_modules/tape-modern/dist/tape-modern.umd.js"; function file_C$3a$5cprojects$5cspect$5cnode_modules$5ctape$2dmodern$5cdist$5ctape$2dmodern$2eumd$2ejs(module, exports, require, __filename, __dirname, __import_meta) {
~function() {
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.tape = {})));
}(this, (function (exports) { 'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */













function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var fulfil;
var done = new Promise(function (f) {
    fulfil = f;
});
function start() {
    if (!running) {
        running = true;
        console.log('TAP version 13');
        Promise.resolve().then(function () {
            var hasOnly = tests.some(function (test) { return test.only; });
            tests.forEach(function (test) {
                test.shouldRun = test.skip
                    ? false
                    : hasOnly ? test.only : true;
            });
            dequeue();
        });
    }
}
var test = Object.assign(function test(name, fn) {
    tests.push({ name: name, fn: fn, skip: false, only: false, shouldRun: false });
    start();
}, {
    skip: function (name, fn) {
        tests.push({ name: name, fn: fn, skip: true, only: false, shouldRun: null });
        start();
    },
    only: function (name, fn) {
        tests.push({ name: name, fn: fn, skip: false, only: true, shouldRun: null });
        start();
    }
});
var testIndex = 0;
var assertIndex = 0;
var running = false;
var tests = [];
var passed = 0;
var failed = 0;
var skipped = 0;
var isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]';
function logResult(ok, operator, msg, info) {
    if (info === void 0) { info = {}; }
    assertIndex += 1;
    if (ok) {
        console.log("ok " + assertIndex + " \u2014 " + msg);
        passed += 1;
    }
    else {
        console.log("not ok " + assertIndex + " \u2014 " + msg);
        failed += 1;
        console.log('  ---');
        console.log("  operator: " + operator);
        if (isNode) {
            var util = require('util');
            if ('expected' in info)
                console.log("  expected:\n    " + util.format(info.expected).replace(/\n/gm, "\n    "));
            if ('actual' in info)
                console.log("  actual:\n    " + util.format(info.actual).replace(/\n/gm, "\n    "));
        }
        else {
            if ('expected' in info)
                console.log("  expected:", info.expected);
            if ('actual' in info)
                console.log("  actual:", info.actual);
        }
        // find where the error occurred, and try to clean it up
        var lines = new Error().stack.split('\n').slice(3);
        var cwd_1 = '';
        if (isNode) {
            cwd_1 = process.cwd();
            if (/[\/\\]/.test(cwd_1[0]))
                cwd_1 += cwd_1[0];
            var dirname = typeof __dirname === 'string' && __dirname.replace(/dist$/, '');
            for (var i = 0; i < lines.length; i += 1) {
                if (~lines[i].indexOf(dirname)) {
                    lines = lines.slice(0, i);
                    break;
                }
            }
        }
        var stack = lines
            .map(function (line) { return "    " + line.replace(cwd_1, '').trim(); })
            .join('\n');
        console.log("  stack:   \n" + stack);
        console.log("  ...");
    }
}
var assert = {
    fail: function (msg) { return logResult(false, 'fail', msg); },
    pass: function (msg) { return logResult(true, 'pass', msg); },
    ok: function (value, msg) {
        if (msg === void 0) { msg = 'should be truthy'; }
        return logResult(Boolean(value), 'ok', msg, {
            actual: value,
            expected: true
        });
    },
    equal: function (a, b, msg) {
        if (msg === void 0) { msg = 'should be equal'; }
        return logResult(a === b, 'equal', msg, {
            actual: a,
            expected: b
        });
    },
    throws: function (fn, expected, msg) {
        if (msg === void 0) { msg = 'should throw'; }
        try {
            fn();
            logResult(false, 'throws', msg, {
                expected: expected
            });
        }
        catch (err) {
            if (expected instanceof Error) {
                logResult(err.name === expected.name, 'throws', msg, {
                    actual: err.name,
                    expected: expected.name
                });
            }
            else if (expected instanceof RegExp) {
                logResult(expected.test(err.toString()), 'throws', msg, {
                    actual: err.toString(),
                    expected: expected
                });
            }
            else if (typeof expected === 'function') {
                logResult(expected(err), 'throws', msg, {
                    actual: err
                });
            }
            else {
                throw new Error("Second argument to t.throws must be an Error constructor, regex, or function");
            }
        }
    }
};
function dequeue() {
    return __awaiter(this, void 0, void 0, function () {
        var test, err_1, total;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    test = tests[testIndex++];
                    if (!test) return [3 /*break*/, 5];
                    if (!test.shouldRun) {
                        if (test.skip) {
                            console.log("# skip " + test.name);
                        }
                        skipped += 1;
                        dequeue();
                        return [2 /*return*/];
                    }
                    console.log("# " + test.name);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, test.fn(assert)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    failed += 1;
                    console.log("not ok " + assertIndex + " \u2014 " + err_1.message);
                    console.error("  " + err_1.stack.replace(/^\s+/gm, '    '));
                    return [3 /*break*/, 4];
                case 4:
                    dequeue();
                    return [3 /*break*/, 6];
                case 5:
                    total = passed + failed + skipped;
                    console.log("\n1.." + total);
                    console.log("# tests " + total);
                    if (passed)
                        console.log("# pass " + passed);
                    if (failed)
                        console.log("# fail " + failed);
                    if (skipped)
                        console.log("# skip " + skipped);
                    fulfil();
                    if (isNode)
                        process.exit(failed ? 1 : 0);
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}

exports.done = done;
exports.test = test;
exports.assert = assert;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=tape-modern.umd.js.map
}()}
  Pax.files["C:/projects/spect/src/htm.js"] = file_C$3a$5cprojects$5cspect$5csrc$5chtm$2ejs; file_C$3a$5cprojects$5cspect$5csrc$5chtm$2ejs.deps = {}; file_C$3a$5cprojects$5cspect$5csrc$5chtm$2ejs.filename = "C:/projects/spect/src/htm.js"; function file_C$3a$5cprojects$5cspect$5csrc$5chtm$2ejs(module, exports, require, __filename, __dirname, __import_meta) {
Object.defineProperty(exports, '__esModule', {value: true})
~function() {
'use strict';
Object.defineProperties(exports, {
  default: {get() {return __default}, enumerable: true},
});

/**
 * MAXI fork of htm with ordered props (ohtm)
 * takes in html`` template literal
 * returns hierarchical arrays structure as
 * [mainAspect, ...secondaryAspects, children, ...namedAspects]
 * eg. ['div', function(){}, value, true, [ 'small', 'red', ...{color: 'red'}], ...{children: []}]
 * that's a bit redundant by providing named props, similar to regexp.match, but corresponds to aspects indexes
 */

// commands for eval
const TAG_SET = 1;
const PROPS_SET = 2;
const PROPS_ASSIGN = 3;
const CHILD_RECURSE = 4;
const CHILD_APPEND = 0;

// parsing mode indicates current [transition] logic/state
const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_ATTRIBUTE = 4;


// turn statics into sequence of commands tuples of a kind
// [..., value, operation, propName?, ...]
function parse (statics) {
  let mode = MODE_TEXT;
  let buffer = '';
  let quote = '';

  // 0 indicates reference to 0 field, which is statics
  let current = [0];
  let char, propName;

  // commit tuple of specific type
  const commit = field => {
    if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,'')))) {
      current.push(field || buffer, CHILD_APPEND);
    }
    else if (mode === MODE_TAGNAME && (field || buffer)) {
      current.push(field || buffer, TAG_SET);
      mode = MODE_WHITESPACE;
    }
    else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
      current.push(field, PROPS_ASSIGN);
    }
    else if (mode === MODE_WHITESPACE && buffer && !field) {
      current.push(true, PROPS_SET, buffer);
    }
    else if (mode === MODE_ATTRIBUTE && propName) {
      current.push(field || buffer, PROPS_SET, propName);
      propName = '';
    }
    // < ${fn} > - anonymous prop
    else if (mode === MODE_WHITESPACE && field) {
      current.push(field, PROPS_SET, '')
    }
    buffer = '';
  };

  // walk by static parts
  for (let i=0; i<statics.length; i++) {
    if (i) {
      if (mode === MODE_TEXT) {
        commit();
      }
      // write field (insertion) value index (reference)
      commit(i);
    }

    // accumulate buffer with the next token
    for (let j=0; j<statics[i].length; j++) {
      char = statics[i][j];

      if (mode === MODE_TEXT) {
        if (char === '<') {
          // commit accumulated text
          commit();
          // create new level (nested array)
          current = [current];
          mode = MODE_TAGNAME;
        }
        else {
          // accumulate text
          buffer += char;
        }
      }

      // Non-text modes
      // quoted values are accumulated escaped, quotes are ignored
      else if (quote) {
        if (char === quote) {
          quote = '';
        }
        else {
          buffer += char;
        }
      }
      else if (char === '"' || char === "'") {
        quote = char;
      }
      // closed tag turns on the text mode, saves accumulated aspects sequence
      else if (char === '>') {
        commit();
        mode = MODE_TEXT;
      }
      else if (!mode) {
        // Ignore everything until the tag ends
      }
      // assignment puts accumulated buffer value to propName, cleans up buffer
      else if (char === '=') {
        mode = MODE_ATTRIBUTE;
        propName = buffer;
        buffer = '';
      }
      // 0 in child list keeps reference to the parent level
      else if (char === '/') {
        commit();
        // if we've opened level for closing tagname </> - unwrap that
        if (mode === MODE_TAGNAME) {
          current = current[0];
        }

        let child = current;
        (current = current[0]).push(child, CHILD_RECURSE);
        mode = MODE_SLASH;
      }
      // separate token
      else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a disabled>
        commit();
        mode = MODE_WHITESPACE;
      }
      else {
        buffer += char;
      }
    }
  }
  commit();

  return current;
};


// `fields` is index of values passed from html`field1: ${field1} field2: ${field2}` → `[statics, field1, field2]`
// `current` is tree level with command tuples sequence
function evaluate (current, fields) {
  let tag, props = []
  let children = []

  // start from 1 because 0 is parent
  for (let i = 1; i < current.length; i++) {
    const field = current[i++];

    // if field is a number - that's a reference to value in tpl fields
    const value = typeof field === 'number' ? fields[field] : field;


    if (current[i] === TAG_SET) {
      tag = value
    }
    else if (current[i] === PROPS_SET) {
      props.push(value)
      let name = current[++i]
      if (name) props[name] = value
    }
    else if (current[i] === PROPS_ASSIGN) {
      for (let name in value) {
        props.push(value)
        props[name] = value[name]
      }
    }
    else if (current[i] === CHILD_RECURSE) {
      // code === CHILD_RECURSE
      children.push(evaluate(value, fields));
    }
    else {
      // code === CHILD_APPEND
      children.push(value);
    }
  }

  return { tag, props, children }
};


const CACHE = {};

// `statics` is tpl literal parts split by placeholders, eg. `a ${b} c` → [`a `, ` c`]
function html (statics) {
  const key = statics.join('')
  const tpl = CACHE[key] || (CACHE[key] = parse(statics))
  return evaluate(tpl, arguments);
}

 const __default =  html;
}()}
  Pax.files["C:/projects/spect/test/htm.js"] = file_C$3a$5cprojects$5cspect$5ctest$5chtm$2ejs; file_C$3a$5cprojects$5cspect$5ctest$5chtm$2ejs.deps = {"./index.js":file_C$3a$5cprojects$5cspect$5ctest$5cindex$2ejs,"../src/htm.js":file_C$3a$5cprojects$5cspect$5csrc$5chtm$2ejs}; file_C$3a$5cprojects$5cspect$5ctest$5chtm$2ejs.filename = "C:/projects/spect/test/htm.js"; function file_C$3a$5cprojects$5cspect$5ctest$5chtm$2ejs(module, exports, require, __filename, __dirname, __import_meta) {
Object.defineProperty(exports, '__esModule', {value: true})
with (function() {
  const __module0 = require._esModule('./index.js')
  const __module1 = require._esModule('../src/htm.js')
  return Object.freeze(Object.create(null, {
    [Symbol.toStringTag]: {value: 'ModuleImports'},
    test: {get() {return __module0.test}, enumerable: true},
    htm: {get() {return __module1.default}, enumerable: true},
  }))
}()) ~function() {
'use strict';

     
   

console.log(htm)

test('empty', () => {
  expect(htm``).toEqual(undefined);
});

// TODO: htm bugs.
// 1. CACHE doesn't cache
// 2. quotes don't escape themselves
// console.log(h`<a x="ab\"c"def />`)
// 3. make anonymous props possible (available by index key)

test.only('anonymous attributes', () => {
  console.log(htm`<a x ${() => {}} y=1 z=${2}><b/></a>c`)
})

test('single named elements', () => {
  // console.log(h`<a x y=1 z=${2}><b/></a>c`)
  // console.log(h`<a></a>abc`)
  // console.log(h`a${123}c`)
  // console.log(h`${123}`)
  // console.log(h`<a x y=1 z=${2} ...${{}}/>`)

  t.deepEqual(htm`<div />`, {tag: 'div'});
  expect(htm`<div/>`).toEqual({ tag: 'div', props: null, children: [] });
  expect(htm`<span />`).toEqual({ tag: 'span', props: null, children: [] });
});

test('multiple root elements', () => {
  expect(htm`<a /><b></b><c><//>`).toEqual([
    { tag: 'a', props: null, children: [] },
    { tag: 'b', props: null, children: [] },
    { tag: 'c', props: null, children: [] }
  ]);
});

test('single dynamic tag name', () => {
  expect(htm`<${'foo'} />`).toEqual({ tag: 'foo', props: null, children: [] });
  function Foo () {}
  expect(htm`<${Foo} />`).toEqual({ tag: Foo, props: null, children: [] });
});

test('single boolean prop', () => {
  expect(htm`<a disabled />`).toEqual({ tag: 'a', props: { disabled: true }, children: [] });
});

test('two boolean props', () => {
  expect(htm`<a invisible disabled />`).toEqual({ tag: 'a', props: { invisible: true, disabled: true }, children: [] });
});

test('single prop with empty value', () => {
  expect(htm`<a href="" />`).toEqual({ tag: 'a', props: { href: '' }, children: [] });
});

test('two props with empty values', () => {
  expect(htm`<a href="" foo="" />`).toEqual({ tag: 'a', props: { href: '', foo: '' }, children: [] });
});

test('single prop with static value', () => {
  expect(htm`<a href="/hello" />`).toEqual({ tag: 'a', props: { href: '/hello' }, children: [] });
});

test('single prop with static value followed by a single boolean prop', () => {
  expect(htm`<a href="/hello" b />`).toEqual({ tag: 'a', props: { href: '/hello', b: true }, children: [] });
});

test('two props with static values', () => {
  expect(htm`<a href="/hello" target="_blank" />`).toEqual({ tag: 'a', props: { href: '/hello', target: '_blank' }, children: [] });
});

test('single prop with dynamic value', () => {
  expect(htm`<a href=${'foo'} />`).toEqual({ tag: 'a', props: { href: 'foo' }, children: [] });
});

test('two props with dynamic values', () => {
  function onClick(e) { }
  expect(htm`<a href=${'foo'} onClick=${onClick} />`).toEqual({ tag: 'a', props: { href: 'foo', onClick }, children: [] });
});

test('prop with quoted dynamic value ignores static parts', () => {
  expect(htm`<a href="before${'foo'}after" a="b" />`).toEqual({ tag: 'a', props: { href: 'foo', a: 'b' }, children: [] });
});

test('spread props', () => {
  expect(htm`<a ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { foo: 'bar' }, children: [] });
  expect(htm`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
  expect(htm`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a b="1" ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: '1', foo: 'bar' }, children: [] });
  expect(htm`<a x="1"><b y="2" ...${{ c: 'bar' }}/></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2', c: 'bar' }) ));
  expect(htm`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`).toEqual(h('a',{ b: 2, c: 3 }, 'd: ', 4));
  expect(htm`<a ...${{ c: 'bar' }}><b ...${{ d: 'baz' }}/></a>`).toEqual(h('a', { c: 'bar' }, h('b', { d: 'baz' }) ));
});

test('multiple spread props in one element', () => {
  expect(htm`<a ...${{ foo: 'bar' }} ...${{ quux: 'baz' }} />`).toEqual({ tag: 'a', props: { foo: 'bar', quux: 'baz' }, children: [] });
});

test('mixed spread + static props', () => {
  expect(htm`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
  expect(htm`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a ...${{ foo: 'bar' }} b c />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
});

test('closing tag', () => {
  expect(htm`<a></a>`).toEqual({ tag: 'a', props: null, children: [] });
  expect(htm`<a b></a>`).toEqual({ tag: 'a', props: { b: true }, children: [] });
});

test('auto-closing tag', () => {
  expect(htm`<a><//>`).toEqual({ tag: 'a', props: null, children: [] });
});

test('text child', () => {
  expect(htm`<a>foo</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] });
  expect(htm`<a>foo bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo bar'] });
  expect(htm`<a>foo "<b /></a>`).toEqual({ tag: 'a', props: null, children: ['foo "', { tag: 'b', props: null, children: [] }] });
});

test('dynamic child', () => {
  expect(htm`<a>${'foo'}</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] });
});

test('mixed text + dynamic children', () => {
  expect(htm`<a>${'foo'}bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo', 'bar'] });
  expect(htm`<a>before${'foo'}after</a>`).toEqual({ tag: 'a', props: null, children: ['before', 'foo', 'after'] });
  expect(htm`<a>foo${null}</a>`).toEqual({ tag: 'a', props: null, children: ['foo', null] });
});

test('element child', () => {
  expect(htm`<a><b /></a>`).toEqual(h('a', null, h('b', null)));
});

test('multiple element children', () => {
  expect(htm`<a><b /><c /></a>`).toEqual(h('a', null, h('b', null), h('c', null)));
  expect(htm`<a x><b y /><c z /></a>`).toEqual(h('a', { x: true }, h('b', { y: true }), h('c', { z: true })));
  expect(htm`<a x=1><b y=2 /><c z=3 /></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2' }), h('c', { z: '3' })));
  expect(htm`<a x=${1}><b y=${2} /><c z=${3} /></a>`).toEqual(h('a', { x: 1 }, h('b', { y: 2 }), h('c', { z: 3 })));
});

test('mixed typed children', () => {
  expect(htm`<a>foo<b /></a>`).toEqual(h('a', null, 'foo', h('b', null)));
  expect(htm`<a><b />bar</a>`).toEqual(h('a', null, h('b', null), 'bar'));
  expect(htm`<a>before<b />after</a>`).toEqual(h('a', null, 'before', h('b', null), 'after'));
  expect(htm`<a>before<b x=1 />after</a>`).toEqual(h('a', null, 'before', h('b', { x: '1' }), 'after'));
  expect(htm`
    <a>
      before
      ${'foo'}
      <b />
      ${'bar'}
      after
    </a>
  `).toEqual(h('a', null, 'before', 'foo', h('b', null), 'bar', 'after'));
});

test('hyphens (-) are allowed in attribute names', () => {
  expect(htm`<a b-c></a>`).toEqual(h('a', { 'b-c': true }));
});

test('NUL characters are allowed in attribute values', () => {
  expect(htm`<a b="\0"></a>`).toEqual(h('a', { b: '\0' }));
  expect(htm`<a b="\0" c=${'foo'}></a>`).toEqual(h('a', { b: '\0', c: 'foo' }));
});

test('NUL characters are allowed in text', () => {
  expect(htm`<a>\0</a>`).toEqual(h('a', null, '\0'));
  expect(htm`<a>\0${'foo'}</a>`).toEqual(h('a', null, '\0', 'foo'));
});

test('cache key should be unique', () => {
  htm`<a b="${'foo'}" />`;
  expect(htm`<a b="\0" />`).toEqual(h('a', { b: '\0' }));
  expect(htm`<a>${''}9aaaaaaaaa${''}</a>`).not.toEqual(htm`<a>${''}0${''}aaaaaaaaa${''}</a>`);
  expect(htm`<a>${''}0${''}aaaaaaaa${''}</a>`).not.toEqual(htm`<a>${''}.8aaaaaaaa${''}</a>`);
});

test('do not mutate spread variables', () => {
  const obj = {};
  htm`<a ...${obj} b="1" />`;
  expect(obj).toEqual({});
});
}()}
  Pax.files["C:/projects/spect/test/index.js"] = file_C$3a$5cprojects$5cspect$5ctest$5cindex$2ejs; file_C$3a$5cprojects$5cspect$5ctest$5cindex$2ejs.deps = {"./htm.js":file_C$3a$5cprojects$5cspect$5ctest$5chtm$2ejs,"tape-modern":file_C$3a$5cprojects$5cspect$5cnode_modules$5ctape$2dmodern$5cdist$5ctape$2dmodern$2eumd$2ejs}; file_C$3a$5cprojects$5cspect$5ctest$5cindex$2ejs.filename = "C:/projects/spect/test/index.js"; function file_C$3a$5cprojects$5cspect$5ctest$5cindex$2ejs(module, exports, require, __filename, __dirname, __import_meta) {
Object.defineProperty(exports, '__esModule', {value: true})
with (function() {
  const __module0 = require._esModule('tape-modern')
  const __module1 = require._esModule('./htm.js')
  return Object.freeze(Object.create(null, {
    [Symbol.toStringTag]: {value: 'ModuleImports'},
    test: {get() {return __module0.test}, enumerable: true},
    assert: {get() {return __module0.assert}, enumerable: true},
  }))
}()) ~function() {
'use strict';

    

// assert.deepEqual = (a, b, msg) => {
//   for (let i = 0; i < Math.max(a.length, b.length); i++) {
//     if (a[i] !== b[i]) {
//       console.error('Not deepEqual', a, b)
//       throw Error(msg)
//     }
//   }
// }

// // tick is required to let mutation pass
// export function delay (delay=0) { return new Promise((ok) => setTimeout(ok, delay))}
// export { test }

// export const tick = delay()

 
// import ('./mount.js')
// import('./core.js')
// import('./selector.js')


// props
// apply to target
// apply to selector
// CRUD
// updating causes change


}()}
  Pax.main = file_C$3a$5cprojects$5cspect$5ctest$5cindex$2ejs; Pax.makeRequire(null)()
  if (typeof module !== 'undefined') module.exports = Pax.main.module && Pax.main.module.exports
}(typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this)
//# sourceMappingURL=bundle.js.map
