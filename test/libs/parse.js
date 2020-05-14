// lightweight parse HTML, modify template & create program

// const TEXT = 3, ELEMENT = 1, ATTRIBUTE = 2, COMMENT = 8, FRAGMENT = 11
const TEXT = 'TEXT', ELEMENT = 'ELEM', ATTRIBUTE = 'ATTR', COMMENT = 'COMM', FRAGMENT = 'FRAG'

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

  // add chunk to output string, to program from current state; no modes management
  const commit = (field) => {
    if (mode === ELEMENT) { prog.push(buf), progs.push(prog) }
    else if (mode === ATTRIBUTE) { if (tmp && buf) tmp.push(buf) }
    buf = '', tmp = undefined
  }

  // walker / mode manager
	for (let i=0; i<statics.length; ) {
    part = ''

		for (let j=0; j < statics[i].length; j++) {
			part += char = statics[i][j];

			if (mode === TEXT) { if (char === '<') { prog = [mode = ELEMENT], buf = '' } }
      // Ignore everything until the last three characters are '-', '-' and '>'
			else if (mode === COMMENT) {
        if (buf === '--' && char === '>') {
          mode = TEXT, buf = ''
        }
        else buf = char + buf[0]
      }
			else if (quote) { if (char === quote) (quote = ''); else (buf += char) }
			else if (char === '"' || char === "'") (quote = char)

			else if (char === '>') {
        // <//>, </> → </comp>
        if (!mode) {
          if (part.slice(-2) === '/>') part = part.slice(0, part.lastIndexOf('<') + 2) + H_TAG + '>'
        }
        commit(), mode = TEXT
      }
      // Ignore everything until the tag ends
			else if (!mode) {}

      else if (char === '/') {
        // </x...
        if (mode === ELEMENT && !buf) (mode = 0, buf = '/')
        // x/> → x />
        else if ((!j || buf) && statics[i][j+1] === '>') { part = part.slice(0,-1) + ' /' }
        else buf += char
      }

      // else if (char === '=') {}
			else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a,   <#a ;    ELEMENT,  field
        // if (mode === ELEMENT) {
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
        //   prog.push(buf), mode = ATTRIBUTE
        // }
        commit(), mode = ATTRIBUTE
			}
			else buf += char;

      // detect comment
			if (mode === ELEMENT && buf === '!--') { mode = COMMENT; tmp = j - 3 }
		}

    if (++i < statics.length) {
      // >a${1}b${2}c<  →  >a<!--1-->b<!--2-->c<
      if (mode === TEXT) part += '<!---->'
      // <${el} → <h--tag;    ELEMENT, field
      else if (mode === ELEMENT) ((prog.push(i), progs.push(prog)), buf = '', part += H_TAG, mode = ATTRIBUTE)
      else if (mode === COMMENT) {}
      else if (mode === ATTRIBUTE) {
        // <xxx ...${{}};    PROP SPREAD, '...', field
        if (buf === '...') { prog.push(ATTRIBUTE, '...', i), part = part.slice(0, -4) }
        // <xxx ${};    PROP NAME, field, null
        else if (!buf && !tmp) { prog.push(ATTRIBUTE, i, null) }
        else {
          let eq = buf.indexOf('=')

          // <xxx c="a${b}c", <xxx c=a${b}c ;   PROP_TPL, name, [statics, field]
          if (~eq) {
            prog.push(ATTRIBUTE, buf.slice(0, eq), tmp = [])
            // <xxx c=a${a}
            if (eq < buf.length - 1) tmp.push(buf.slice(eq + 1))
            tmp.push(i)
          }
          // <xxx x=${};    PROP VALUE name, field
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
