// cleans up html from comments, replaces fields with placeholders, creates eval programs
// heavily inspired by htm

export const TEXT = 3, ELEM = 1, ATTR = 2, COMM = 8, FRAG = 11, COMP = FRAG
// export const TEXT = 'TEXT', ELEM = 'ELEM', ATTR = 'ATTR', COMM = 'COMM', FRAG = 'FRAG'

// placeholders
const ZWSP = '\u200B', ZWNJ = '\u200C', H_TAG = 'h--tag', H_FIELD = ZWNJ

export default function (statics) {
  // FIXME: <> → <comp>
  let mode = TEXT, buf = '', quote = '', attr, char, sel, el,
      // transformed statics
      parts = [], part, prog = []

  const commit = () => {
    if (mode === ELEM) {prog.push(TEXT, el = buf || H_TAG), mode = ATTR }
    else if (attr) {
      if (buf) attr.push(buf)
      if (attr.length === 1) (prog.pop(), prog.push(attr[0]))
      attr = undefined
    }
    sel = buf = ''
  }

  // walker / mode manager
	for (let i=0; i<statics.length; ) {
    part = ''

		for (let j=0; j < statics[i].length; j++) {
			char = statics[i][j];

			if (mode === TEXT) {
        if (char === '<') { mode = ELEM, buf = '' }
      }
      // Ignore everything until the last three characters are '-', '-' and '>'
			else if (mode === COMM) {
        if (buf === '--' && char === '>') { mode = TEXT, buf = '' }
        else { buf = char + buf[0] }
        char = ''
      }

      // <a#id, <a.class
      else if ((mode === ELEM || sel) && (char === '#' || char === '.')) {
        part += buf ? '' : H_TAG
        if (!sel) ( commit(), mode = ATTR )
        sel = char
        part += (sel === '#' ? ' id=' : ' class=')
        char = ''
      }

      else if (quote) { if (char === quote) (quote = ''); else (buf += char) }
			else if (char === '"' || char === "'") (quote = char)

			else if (char === '>') {
        // <//>, </> → </comp>
        if (!mode && (!buf || buf === '/')) part = part.slice(0, buf ? -buf.length : undefined) + H_TAG
        // <x/> → <x></x>
        else if (buf.slice(-1) === '/') (buf = buf.slice(0,-1), commit(), part = part.slice(0, -1) + '></' + el + '>', char = '')
        else commit()
        mode = TEXT
      }
      // Ignore everything until the tag ends
			else if (!mode) buf = char

      else if (char === '/') {
        // </x...
        if (mode === ELEM && !buf) (mode = 0, buf = '' )
        // x/> → x />
        else buf += char
      }
			else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a,   <#a ;  ELEM,  field, #children
        commit()
			}
			else buf += char;

      // detect comment
			if (mode === ELEM && buf === '!--') { mode = COMM, part = part.slice(0, -3) } else part += char
		}

    if (++i < statics.length) {
      // >a${1}b${2}c<  →  >a<!--1-->b<!--2-->c<
      if (mode === TEXT) part += '<!--' + i + '-->'
      // <${el} → <h--tag;    ELEM, field, children
      else if (mode === ELEM) (prog.push(arguments[i] || COMP, i), part += el = H_TAG, mode = ATTR)
      else if (mode === ATTR) {
        // <xxx ...${{}};    ATTR, null, field
        if (buf === '...') { prog.push(ATTR, null, i), part = part.slice(0, -4) }
        // <xxx ${'name'};    ATTR, field, null
        else if (!buf && !attr) { prog.push(ATTR, i, true) }
        else {
          let eq = buf.indexOf('=')

          // <xxx c="a${b}c", <xxx c=a${b}c ;   ATTR, name, [a, field, b, ...]
          if (~eq) {prog.push(ATTR, buf.slice(0, eq), attr = []), buf = buf.slice(eq + 1)}
          if (buf) attr.push(buf)
          attr.push(i)

          part += H_FIELD
        }
      }

      buf = ''
    }

    parts.push(part)
	}

  return { html: parts.join(''), prog }
}
