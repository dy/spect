const createAnimationFrame = (emitNotSupportedError, window, wrapSubscribeFunction) => {
    return () => wrapSubscribeFunction((observer) => {
        if (window === null || window.cancelAnimationFrame === undefined || window.requestAnimationFrame === undefined) {
            return emitNotSupportedError(observer);
        }
        let animationFrameHandle = window.requestAnimationFrame(function animationFrameCallback(timestamp) {
            animationFrameHandle = window.requestAnimationFrame(animationFrameCallback);
            observer.next(timestamp);
        });
        return () => window.cancelAnimationFrame(animationFrameHandle);
    });
};
const createWrapSubscribeFunction = (patch, toObserver) => {
    const emptyFunction = () => { }; // tslint:disable-line:no-empty
    return (innerSubscribe) => {
        const subscribe = ((...args) => {
            const unsubscribe = innerSubscribe(toObserver(...args));
            if (unsubscribe !== undefined) {
                return unsubscribe;
            }
            return emptyFunction;
        });
        subscribe[Symbol.observable] = () => ({ subscribe: (...args) => ({ unsubscribe: subscribe(...args) }) });
        return patch(subscribe);
    };
};
function patch(arg) {
    if (!Symbol.observable) {
        if (typeof arg === "function" &&
            arg.prototype &&
            arg.prototype[Symbol.observable]) {
            arg.prototype[observable] = arg.prototype[Symbol.observable];
            delete arg.prototype[Symbol.observable];
        }
        else {
            // arg[Symbol.observable] = arg[Symbol.observable];
            // delete arg[Symbol.observable];
        }
    }
    return arg;
}
const noop = () => { };
const rethrow = (error) => {
    throw error;
};
function toObserver(observer) {
    if (observer) {
        if (observer.next && observer.error && observer.complete) {
            return observer;
        }
        return {
            complete: (observer.complete ?? noop).bind(observer),
            error: (observer.error ?? rethrow).bind(observer),
            next: (observer.next ?? noop).bind(observer),
        };
    }
    return {
        complete: noop,
        error: rethrow,
        next: noop,
    };
}
const emitNotSupportedError = (observer) => {
    observer.error(new Error('The required browser API seems to be not supported.'));
    return () => { }; // tslint:disable-line:no-empty
}

const wrapSubscribeFunction = createWrapSubscribeFunction(patch, toObserver);

export const animationFrame = createAnimationFrame(emitNotSupportedError, window, wrapSubscribeFunction);
