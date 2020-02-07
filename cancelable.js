// FIXME: ideally move to a separate file
export default class Cancelable {
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
