import $ from './$'
import { state, prop, fx } from 'spect'
import html, { h } from './html'

$.h = h
$.fn(state, prop, fx)
$.fn(html)

export default $
export { state, prop, fx, html, h }
