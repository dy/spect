export function isObject(x) {
  return  typeof obj === 'object'
    && obj !== null
    && obj.constructor === Object
    && Object.prototype.toString.call(obj) === '[object Object]';
}

export function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction'
}

export const noop = () => { }
