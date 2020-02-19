export function changeable(dep) {
  return dep && !primitive(dep) && (
    Symbol.asyncIterator in dep ||
    'next' in dep ||
    'then' in dep ||
    'subscribe' in dep ||
    observable(dep) ||
    stream(dep)
  )
}

export function stream(dep) {
  return dep && dep.pipe && dep.on
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(dep) {
  return typeof dep === 'function' && 'set' in dep && !('get' in dep)
}

// get current value of reference, changeable or alike
export function getval(v, prev) {
  if (!v || primitive(v)) return v
  if ('current' in v) return v.current
  if (Symbol.toPrimitive in v) return v[Symbol.toPrimitive]()

  // stateless changeables have no state
  if (changeable(v)) return

  if (typeof v === 'function') {
    const result = v(prev)
    if (changeable(result)) return
    v = result
  }

  return v
}

export class Cancelable {
  constructor(executor) {
    this._cancelHandlers = [];
    this._isPending = true;
    this._rejectOnCancel = true;

    this._promise = new Promise((resolve, reject) => {
      this._reject = reject;

      const onResolve = value => {
        this._isPending = false;
        resolve(value);
      };

      const onReject = error => {
        this._isPending = false;
        reject(error);
      };

      const onCancel = handler => {
        if (!this._isPending) {
          throw new Error('The `onCancel` handler was attached after the promise settled.');
        }

        this._cancelHandlers.push(handler);
      };

      Object.defineProperties(onCancel, {
        shouldReject: {
          get: () => this._rejectOnCancel,
          set: boolean => {
            this._rejectOnCancel = boolean;
          }
        }
      });

      return executor(onResolve, onReject, onCancel);
    });
  }

  then(onFulfilled, onRejected) {
    // eslint-disable-next-line promise/prefer-await-to-then
    return this._promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this._promise.catch(onRejected);
  }

  finally(onFinally) {
    return this._promise.finally(onFinally);
  }

  cancel(reason) {
    if (!this._isPending || this.isCanceled) {
      return;
    }

    // mute canceled uncaught error
    this._promise.catch(e => {})

    if (this._cancelHandlers.length > 0) {
      try {
        for (const handler of this._cancelHandlers) {
          handler();
        }
      } catch (error) {
        this._reject(error);
      }
    }

    this.isCanceled = true;
    if (this._rejectOnCancel) {
      this._reject(new Error(reason));
    }
  }
}

Cancelable.prototype.isCanceled = false;

Object.setPrototypeOf(Cancelable.prototype, Promise.prototype);
