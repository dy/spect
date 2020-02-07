export default async function* on(el, event, o) {
  let resolve, p = new Promise(r => resolve = r)

  el.addEventListener(event, e => {
    resolve(e)
    p = new Promise(r => resolve = r)
  }, o)

  while (1) {
    yield await p
  }
}
