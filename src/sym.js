const S = Symbol
export const _channel = S('c'),
            _items = S('i'),
            _delete = S('d'),
            _scope = S('s'),
            _fn = S('f'),
            _selector = S('$'),
            _match = S('m'),
            _animation = S('a'),
            _teardown = S('t'),
            _static = _scope

if (!S.observable) S.observable=S('observable')
if (!S.dispose) S.dispose=S('dispose')
