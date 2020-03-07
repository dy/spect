import state from "../core/state.js"

export default function resize (el) {
  const box = state([])

  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      if(entry.contentBoxSize) {
        box[1] = entry.contentBoxSize.blockSize
        box[0] = entry.contentBoxSize.inlineSize
      } else {
        box[0] = entry.contentRect.width
        box[1] = entry.contentRect.height
      }
    }
  });

  resizeObserver.observe(el);

  return (...args) => {
    if (!args.length) return get()
    if (args[0] === CANCEL) {
      resizeObserver.unobserve()
    }
  }
}
