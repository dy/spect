// symbol.dispose & symbol.observable polyfill

var Symbol = globalThis.Symbol;

export const dispose = Symbol ? (Symbol.dispose || (Symbol.dispose = Symbol('dispose'))) : '@@dispose'
export const observable = Symbol ? (Symbol.observable || (Symbol.observable = Symbol('observable'))) : '@@observable'
