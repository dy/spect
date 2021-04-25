export const _channel = Symbol('c'),
            _items = Symbol('i'),
            _delete = Symbol('d'),
            _scope = Symbol('s'),
            _fn = Symbol('f'),
            _selector = Symbol('$'),
            _match = Symbol('m'),
            _animation = Symbol('a'),
            _teardown = Symbol('t'),
            _static = _scope

if (!Symbol.observable) Symbol.observable=Symbol('observable')
if (!Symbol.dispose) Symbol.dispose=Symbol('dispose')
