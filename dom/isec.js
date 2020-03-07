import channel from '../core/channel.js'

export default function isec(a, b) {
  let c = channel()
  let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        // Each entry describes an intersection change for one observed
        // target element:
        //   entry.boundingClientRect
        //   entry.intersectionRatio
        //   entry.intersectionRect
        //   entry.isIntersecting
        //   entry.rootBounds
        //   entry.target
        //   entry.time
        c(entry)
      })
    }, {
    root: a,
    rootMargin: '0px',
    threshold: 1
  })
  observer.observe(b)

  return (...args) => {

  }
}
