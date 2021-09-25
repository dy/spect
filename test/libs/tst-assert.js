export function fail(msg) {
  this.log(false, 'fail', msg)
}

export function pass(msg) {
  this.log(true, 'pass', msg)
}

export function ok(value, msg = 'should be truthy') {
  this.log(Boolean(value), 'ok', msg, {
    actual: value,
    expected: true
  })
}

export function is(a, b, msg = 'should be the same') {
  this.log(isPrimitive(a) || isPrimitive(b) ? Object.is(a, b) : deq(a, b), 'is', msg, {
    actual: slice(a),
    expected: slice(b)
  })
}

export function not(a, b, msg = 'should be different') {
  this.log(isPrimitive(a) || isPrimitive(b) ? !Object.is(a, b) : !deq(a, b), 'is not', msg, {
    actual: slice(a),
    expected: new class Not { constructor(a){this.actual = a}  }(a)
  })
}

export function same(a, b, msg = 'should have same members') {
  this.log(sameMembers(a, b), 'same', msg, {
    actual: a,
    expected: b
  })
}

export function any(a, list, msg = 'should be one of') {
  this.log(list.some(b =>
    isPrimitive(a) || isPrimitive(b) ? Object.is(a, b) : deq(a, b)
  ), 'any', msg, {
    actual: slice(a),
    expected: new (class Any extends Array { })(...list.map(b => slice(b)))
  })
}

export function almost (a, b, eps, msg = 'should almost equal') {
  this.log(isPrimitive(a) || isPrimitive(b) ? almostEqual(a, b, eps) :
    Array.prototype.slice.call(a).every((a0, i) => a0 === b[i] || almostEqual(a0, b[i], eps)),
    'almost', msg, {
    actual: slice(a),
    expected: slice(b)
  })
}

export function throws(fn, expected, msg = 'should throw') {
  try {
    fn()
    this.log(false, 'throws', msg, {
      expected
    })
  } catch (err) {
    if (expected instanceof Error) {
      this.log(err.name === expected.name, 'throws', msg, {
        actual: err.name,
        expected: expected.name
      })
    } else if (expected instanceof RegExp) {
      this.log(expected.test(err.toString()), 'throws', msg, {
        actual: err.toString(),
        expected: expected
      })
    } else if (typeof expected === 'function') {
      this.log(expected(err), 'throws', msg, {
        actual: err
      })
    } else {
      this.log(true, 'throws', msg)
    }
  }
}

function deq (a, b) {
  if (a === b) return true
  if (a && b) {
    if (a.constructor === b.constructor) {
      if (a.constructor === RegExp) return a.toString() === b.toString()
      if (a.constructor === Date) return a.getTime() === b.getTime()
      if (a.constructor === Array) return a.length === b.length && a.every((a, i) => deq(a, b[i]))
      if (a.constructor === Object) return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => deq(a[key], b[key]))
    }
    if (!isPrimitive(a) && a[Symbol.iterator] && b[Symbol.iterator]) return deq([...a], [...b])
  }
  return a !== a && b !== b
}

function isPrimitive(val) {
  if (typeof val === 'object') {
    return val === null;
  }
  return typeof val !== 'function';
}

function almostEqual(a, b, eps) {
  if (eps === undefined) {
    eps = Math.min(
      Math.max(
        Math.abs(a - new Float32Array([a])[0]),
        Math.abs(b - new Float32Array([b])[0])
      ),
      1.19209290e-7
    )
  }

  var d = Math.abs(a - b)

  if (d <= eps) return true

  return a === b
}

function sameMembers(a, b) {
  a = Array.from(a), b = Array.from(b)

  if (a.length !== b.length) return false;

  if (!b.every(function (item) {
    var idx = a.indexOf(item);
    if (idx < 0) return false;
    a.splice(idx, 1);
    return true;
  })) return false;

  if (a.length) return false;

  return true;
}

const slice = a => isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a)
