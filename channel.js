import _observable from 'symbol-observable'

export default (...subs) => {
    const next = val => subs.map(sub => sub(val))
    const cancel = (...unsubs) => (
        unsubs = subs.map(sub => sub.unsubscribe),
        subs.length = 0,
        unsubs.map(unsub => unsub && unsub())
    )
    const subscribe = (next, error, complete) => {
        next = (next.call ? next : next.next).bind()
        subs.push(next)
        complete = next.call ? complete : next.complete
        const unsubscribe = () => (
            subs.length && subs.splice(subs.indexOf(next) >>> 0, 1),
            complete && complete(),
            unsubscribe.closed = true
        )
        next.unsubscribe = unsubscribe.unsubscribe = unsubscribe
        unsubscribe.closed = false
        return unsubscribe
    }

    return Object.assign(
        val => observer(val) ? subscribe(val) : next(val),
        {
            next,
            subscribe,
            cancel,
            [_observable](){return this}
        })
}

export const observer = (val) => !!(val && (val.call || val.next))
