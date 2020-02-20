import ref from './src/ref.js'

export default function input (el) {
  const value = ref()

  const set = value.set
  value.set = (value) => set(el.value = value)
  value.get = () => el.value

  // track direct el.value for unfocused state
  // let focus = state(document.activeElement === el)
  // el.addEventListener('focus', () => focus(true))
  // el.addEventListener('blur', () => focus(false))
  // fx(focus => {
  //   if (focus) return
  //   let vx = prop(el, 'value')
  //   fx(v => set(v + ''), [vx])
  //   return () => vx.cancel()
  // }, [focus])

  // track updates for focused state
  const update = e => { value(e.target.value) }
  el.addEventListener('change', update)
  el.addEventListener('input', update)

  const cancel = value.cancel
  value.cancel = () => {
    el.removeEventListener('change', update)
    el.removeEventListener('input', update)
    cancel()
  }

  return value
}
