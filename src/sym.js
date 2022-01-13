const S = Symbol
export const _teardown = S('t'), _static = S('s')

if (!S.observable) S.observable=S('observable')
if (!S.dispose) S.dispose=S('dispose')
