export const CANCEL = null

export default (...subs) =>
    (val =>
        val === CANCEL ? subs.length = 0 :
        observer(val) ?
        (val = val.next || val, subs.push(val), () => subs.splice(subs.indexOf(val) >>> 0, 1)) :
        subs.map(sub => sub(val))
    )

export const observer = (val) => !!(val && (val.call || val.next))
