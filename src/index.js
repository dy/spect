import $ from './$'
import html, {h} from './html'
import on from './on'
import attr from './attr'
import state from './state'
import prop from './prop'
import fx from './fx'
import mount from './mount'
import css from './css'
import clx from './class'

$.fn(html, on, attr, state, prop, fx, mount, css, clx)

export { h }
export default $
