import _observable from 'symbol-observable'

export default (...subs) => {
    const _teardown = Symbol('teardown'), _unsubscribe = Symbol('unsub')

    const next = (val, subs=channel.subs) => {
        subs.map(sub => {
            if (sub[_teardown] && sub[_teardown].call) sub[_teardown]()
            sub[_teardown] = sub(val)
        })
    }

    const cancel = () => {
        subs.map(sub => (
            sub[_teardown] && sub[_teardown].call && sub[_teardown](),
            delete sub[_teardown],
            sub[_unsubscribe](),
            delete sub[_unsubscribe]
        ))
        subs.length = 0
        channel.closed = true
    }

    const subscribe = (next, error, complete) => {
        next = next.call ? next : next.next
        complete = next.call ? complete : next.complete
        subs.push(next)

        const unsubscribe = () => {
            if (subs.length) subs.splice(subs.indexOf(next) >>> 0, 1)
            if (complete) complete()
            unsubscribe.closed = true
        }
        next[_unsubscribe] = unsubscribe.unsubscribe = unsubscribe
        unsubscribe.closed = false
        return unsubscribe
    }

    const channel = val => observer(val) ? subscribe(val) : next(val)

    return Object.assign(channel, {
        subs,
        closed: false,
        next,
        subscribe,
        cancel,
        [_observable](){return this}
    })
}

export const observer = (val) => !!(val && (val.call || val.next))
