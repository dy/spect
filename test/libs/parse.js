// cleans up html from comments, replaces fields with placeholders, creates eval programs

export const TEXT = 3, ELEM = 1, ATTR = 2, COMM = 8, FRAG = 11
// export const TEXT = 'TEXT', ELEM = 'ELEM', ATTR = 'ATTR', COMM = 'COMM', FRAG = 'FRAG'

// placeholders
const ZWSP = '\u200B', ZWNJ = '\u200C', ZWJ = '\u200D', FIELD = '\0', FIELD_RE = /\0/g, HTML_FIELD = ZWSP
const H_TAG = 'h--tag'

export default (statics) => {
  // FIXME: <> → <comp>
  let mode = TEXT, buf = '', quote = '', tmp, char,
      // transformed statics
      parts = [], part,
      // current element program (id/query, props, children type)
      progs = [], prog

  // walker / mode manager
	for (let i=0; i<statics.length; ) {
    part = ''

		for (let j=0; j < statics[i].length; j++) {
			char = statics[i][j];

			if (mode === TEXT) { if (char === '<') { prog = [mode = ELEM], buf = '' } }
      // Ignore everything until the last three characters are '-', '-' and '>'
			else if (mode === COMM) {
        if (buf === '--' && char === '>') { mode = TEXT, buf = '' }
        else { buf = char + buf[0] }
        char = ''
      }
			else if (quote) { if (char === quote) (quote = ''); else (buf += char) }
			else if (char === '"' || char === "'") (quote = char)

			else if (char === '>') {
        // <//>, </> → </comp>
        if (!mode) {
          if (part.slice(-1) === '/') part = part.slice(0, part.lastIndexOf('<') + 2) + H_TAG
        }
        else if (mode === ELEM) { prog.push(buf), progs.push(prog) }
        else if (mode === ATTR && tmp && buf) tmp.push(buf)
        buf = '', tmp = undefined, mode = TEXT
      }
      // Ignore everything until the tag ends
			else if (!mode) {}

      else if (char === '/') {
        // </x...
        if (mode === ELEM && !buf) (mode = 0, buf = '/')
        // x/> → x />
        else if ((!j || buf) && statics[i][j+1] === '>') { part += ' ' }
        else buf += char
      }

      // else if (char === '=') {}
			else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a,   <#a ;    ELEM,  field
        // if (mode === ELEM) {
        //   // FIXME: <a#b.c → <a #b.c
        //   if (/^#|^\.\b/.test(buf)) {
        //     node.removeAttribute(name), --i;
        //     let [beforeId, afterId = ''] = name.split('#')
        //     let beforeClx = beforeId.split('.')
        //     name = beforeClx.shift()
        //     let afterClx = afterId.split('.')
        //     let id = afterClx.shift()
        //     let clx = [...beforeClx, ...afterClx]
        //     // FIXME
        //     // if (id) j -= part.length - (part = part.slice(0, tmp + 1) + H_TAG + part.slice(j))
        //   }
        //   prog.push(buf), mode = ATTR
        // }

        if (mode === ELEM) { prog.push(buf), progs.push(prog), mode = ATTR }
        else if (mode === ATTR && tmp && buf) { tmp.push(buf) }
        buf = '', tmp = undefined
			}
			else buf += char;

      // detect comment
			if (mode === ELEM && buf === '!--') { mode = COMM, part = part.slice(0, -3) }
      else part += char
		}

    if (++i < statics.length) {
      // >a${1}b${2}c<  →  >a<!--1-->b<!--2-->c<
      if (mode === TEXT) part += '<!---->'
      // <${el} → <h--tag;    ELEM, field
      else if (mode === ELEM) ((prog.push(i), progs.push(prog)), buf = '', part += H_TAG, mode = ATTR)
      else if (mode === COMM) {}
      else if (mode === ATTR) {
        // <xxx ...${{}};    ATTR, null, field
        if (buf === '...') { prog.push(ATTR, null, i), part = part.slice(0, -4) }
        // <xxx ${};    ATTR, field, null
        else if (!buf && !tmp) { prog.push(ATTR, i, null) }
        else {
          let eq = buf.indexOf('=')

          // <xxx c="a${b}c", <xxx c=a${b}c ;   ATTR, name, [statics, field]
          if (~eq) {
            prog.push(ATTR, buf.slice(0, eq), tmp = [])
            // <xxx c=a${a}
            if (eq < buf.length - 1) tmp.push(buf.slice(eq + 1))
            tmp.push(i)
          }
          // <xxx x=${};    ATTR, name, field
          else {
            if (tmp && buf) tmp.push(buf)
            tmp.push(i)
          }

          part += ZWNJ
        }
      }

      buf = ''
    }

    parts.push(part)
	}

  return { html: parts.join(''), prog: progs }
}
