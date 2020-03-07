const FIELD = '\ue000', QUOTES = '\ue001'

// xhtm base supercharged with observables
export default function htm (statics) {
  let prev = 0, current = [], field = 0, name, value, quotes = [], quote = 0

  // get string with fields, return observable state string
  const evaluable = (str, raw) => {
    let i = 0
    // if (!str[1] && str[0] === FIELD) return [arguments[++field]]

    const deps = []

    // text content keeps quotes
    str = str.replace(/\ue001/g, m => raw ? quotes[quote++] : quotes[quote++].slice(1, -1))
    str.replace(/\ue000/g, (match, idx, str) => {
        if (idx) deps.push(str.slice(i, idx))
        i = idx + 1
        return deps.push(arguments[++field])
      })
    if (i < str.length) deps.push(str.slice(i))

    // text content may have complicated inserts, like other observables etc
    if (raw) return deps

    // tagname / propname can be only a string
    return calc((...values) => {
      if (values.length === 1) return values[0]
      return values.filter(Boolean).join('')
    }, deps)
  }

  statics
    .join(FIELD)
    .replace(/('|")[^\1]*?\1/g, match => (quotes.push(match), QUOTES))
    .replace(/<!--.*-->/g, '')
    .replace(/\s+/g, ' ')
    // .replace(/^\s*\n\s*|\s*\n\s*$/g,'')

    // ...>text<... sequence
    .replace(/(?:^|>)([^<]*)(?:$|<)/g, (match, text, idx, str) => {
      let close, tag

      if (idx) {
        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(' ').map((part, i) => {
            if (close) throw Error('Bad closing tag')
            if (part[0] === '/') {
              close = true
            }
            else if (!i) {
              current = [current, tag = evaluable(part), []]
            }
            else if (part) {
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                current[2].push('...', arguments[++field])
              }
              else {
                [name, value] = part.split('=')
                // props[evaluate(name)] = value ? evaluate(value) : true
                if (value) {
                  current[2].push(evaluable(name), evaluable(value))
                }
                else {
                  current[2].push(evaluable(name), true)
                }
              }
            }
          })

        // create tag instantly, children will come up
        if (tag) {
          const props = current[2] = calc((...keyValue) => {
            const props = {}
            for (let i = 0; i < keyValue.length; i += 2) {
              let key = keyValue[i], value = keyValue[i+1]
              if (key === '...') Object.assign(props, value)
              else props[key] = value
            }
            return props
          }, current[2])
        }

        if (close) {
          current[0].push(current)
          [current] = current
        }
      }
      prev = idx + match.length
      if (prev < str.length || !idx) {
        if (text) {
          const children = evaluable(text, true)
          current.push(...children)
        }
      }
    })

  return current.length > 1 ? current : current[0]
}

