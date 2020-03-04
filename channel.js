const CANCEL = null

export default (...subs) =>
    (val =>
        val === CANCEL ? subs.length = 0 :
        typeof val === 'function' ?
        (subs.push(val), () => subs.splice(subs.indexOf(val) >>> 0, 1)) :
        subs.map(sub => sub(val))
    )

