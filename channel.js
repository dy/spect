import _observable from 'symbol-observable'

export default () => {
    const subs = []

    const push = (val, subs=channel.subs) => {
        // promise awaits value
        if (val && val.then) return val.then(val => push(val))
        subs.map(sub => {
            if (sub.out && sub.out.call) sub.out()
            if (sub.next) sub.out = sub.next(val)
        })
    }

    const cancel = () => {
        let unsubs = subs.map(sub => {
            if (sub.out && sub.out.call) sub.out()
            return sub.unsubscribe
        })
        subs.length = 0
        unsubs.map(unsub => unsub())
        channel.closed = true
    }

    const subscribe = (next, error, complete) => {
        next = next && next.next || next
        error = next && next.error || error
        complete = next && next.complete || complete

        const unsubscribe = () => {
            if (subs.length) subs.splice(subs.indexOf(subscription) >>> 0, 1)
            if (complete) complete()
            unsubscribe.closed = true
        }
        unsubscribe.unsubscribe = unsubscribe
        unsubscribe.closed = false

        const subscription = { next, error, complete, unsubscribe }
        subs.push(subscription)

        return unsubscribe
    }

    const channel = val => observer(val) ? subscribe(val) : push(val)

    return Object.assign(channel, {
        subs,
        closed: false,
        push,
        subscribe,
        cancel,
        [_observable](){return this}
    })
}

export const observer = (val) => !!(val && (val.call || val.next))
