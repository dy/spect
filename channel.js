import _observable from 'symbol-observable'

export default (...subs) => {
    const next = val => subs.map(sub => sub(val))
    const cancel = () => subs.length = 0
    const subscribe = val => (val = val.next || val, subs.push(val), () => subs.splice(subs.indexOf(val) >>> 0, 1))

    return Object.assign(val =>
        observer(val) ? subscribe(val) :
        next(val)
    , {
        next,
        subscribe,
        cancel,
        [_observable](){return this}
    })
}

export const observer = (val) => !!(val && (val.call || val.next))
