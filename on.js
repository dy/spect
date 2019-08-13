import $ from './$.js'

export default function on (evts, handler) {
  let els = this || $(document)

  // parse events
  let parts = evts.split(/\s+/)
}
