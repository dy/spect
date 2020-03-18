import _observable from 'symbol-observable'

export default (...args) => {
    const observers = []

    const push = (val, observers=channel.observers) => {
        // promise awaits value
        if (val && val.then) return val.then(val => push(val))
        observers.map(sub => {
            if (sub.out && sub.out.call) sub.out()
            if (sub.next) sub.out = sub.next(val)
        })
    }

    const cancel = () => {
        let unsubs = observers.map(sub => {
            if (sub.out && sub.out.call) sub.out()
            return sub.unsubscribe
        })
        observers.length = 0
        unsubs.map(unsub => unsub())
        channel.canceled = true
    }

    const subscribe = (next, error, complete) => {
        next = next && next.next || next
        error = next && next.error || error
        complete = next && next.complete || complete

        const unsubscribe = () => {
            if (observers.length) observers.splice(observers.indexOf(subscription) >>> 0, 1)
            if (complete) complete()
            unsubscribe.canceled = true
        }
        unsubscribe.unsubscribe = unsubscribe
        unsubscribe.canceled = false

        const subscription = { next, error, complete, unsubscribe }
        observers.push(subscription)

        return unsubscribe
    }

    const channel = val => observer(val) ? subscribe(val) : push(val)

    return Object.assign(channel, {
        observers,
        canceled: false,
        push,
        subscribe,
        cancel
    })
}

export const observer = (val) => !!(val && (val.call || val.next))
