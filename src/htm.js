// MAXI fork of htm

// commands for eval
// const TAG_SET = 1;
// const PROPS_SET = 2;
// const PROPS_ASSIGN = 3;
// const CHILD_RECURSE = 4;
// const CHILD_APPEND = 0;
const TAG_SET = 'tag-set';
const PROPS_SET = 'props-set';
const PROPS_ASSIGN = 'props-assign';
const CHILD_RECURSE = 'child-recurse';
const CHILD_APPEND = 'child-append';

// modes for parsing: mode indicates current [transition] logic
const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_ATTRIBUTE = 4;


function parse (statics) {
  const h = this;

  let mode = MODE_TEXT;
  let buffer = '';
  let quote = '';
  // 0 indicates reference to 0 field, which is static parts
  let current = [0];
  let char, propName;

  // commit tuple of specific type
  const commit = field => {
    if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,'')))) {
      current.push(field || buffer, CHILD_APPEND);
    }
    else if (mode === MODE_TAGNAME && (field || buffer)) {
      current.push(field || buffer, TAG_SET);
      mode = MODE_WHITESPACE;
    }
    else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
      current.push(field, PROPS_ASSIGN);
    }
    else if (mode === MODE_WHITESPACE && buffer && !field) {
      current.push(true, PROPS_SET, buffer);
    }
    else if (mode === MODE_ATTRIBUTE && propName) {
      current.push(field || buffer, PROPS_SET, propName);
      propName = '';
    }
    // < ${fn} > - anonymous prop
    else if (mode === MODE_WHITESPACE && field) {
      current.push(field, PROPS_SET, '')
    }
    buffer = '';
  };

  // walk by static parts
  for (let i=0; i<statics.length; i++) {
    // skip 0 field - we start with MODE_TEXT instantly turned into anything
    // so first token cannot be an operation, therefore no need to commit ref to 0 field
    if (i) {
      if (mode === MODE_TEXT) {
        commit();
      }
      // write field (insertion) value index (reference)
      commit(i);
    }

    // accumulate buffer with the next token
    for (let j=0; j<statics[i].length; j++) {
      char = statics[i][j];

      if (mode === MODE_TEXT) {
        if (char === '<') {
          // commit accumulated text
          commit();
          // create new level (nested array)
          current = [current];
          mode = MODE_TAGNAME;
        }
        else {
          // accumulate text
          buffer += char;
        }
      }

      // Non-text modes
      // quoted values are accumulated escaped, quotes are ignored
      else if (quote) {
        if (char === quote) {
          quote = '';
        }
        else {
          buffer += char;
        }
      }
      else if (char === '"' || char === "'") {
        quote = char;
      }
      // closed tag turns on the text mode, saves accumulated aspects sequence
      else if (char === '>') {
        commit();
        mode = MODE_TEXT;
      }
      else if (!mode) {
        // Ignore everything until the tag ends
      }
      // assignment puts accumulated buffer value to propName, cleans up buffer
      else if (char === '=') {
        mode = MODE_ATTRIBUTE;
        propName = buffer;
        buffer = '';
      }
      // 0 in child list keeps reference to the parent level
      else if (char === '/') {
        commit();
        // if we've opened level for closing tagname </> - unwrap that
        if (mode === MODE_TAGNAME) {
          current = current[0];
        }

        let child = current;
        (current = current[0]).push(child, CHILD_RECURSE);
        mode = MODE_SLASH;
      }
      // separate token
      else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a disabled>
        commit();
        mode = MODE_WHITESPACE;
      }
      else {
        buffer += char;
      }
    }
  }
  commit();

  return current;
};


// `current`` is a sequence of tuples of a kind
// [..., value, operation, propName?, ...]
// `fields` is index of values passed from html`field1: ${field1} field2: ${field2}` → `[statics, field1, field2]`
function evaluate (current, fields, level={}) {
  Object.assign(level, {main: '', props: [], children: []})

  // start from 1 because 0 is parent
  for (let i = 1; i < current.length; i++) {
    const field = current[i++];

    // if field is a number - that's a reference to value in tpl fields
    const value = typeof field === 'number' ? fields[field] : field;

    if (current[i] === TAG_SET) {
      level.main = value;
    }
    else if (current[i] === PROPS_SET) {
      level.props.push([current[++i], value])
    }
    else if (current[i] === PROPS_ASSIGN) {
      for (let name in value) {
        level.props.push([name, value[name]])
      }
    }
    else if (current[i] === CHILD_RECURSE) {
      // code === CHILD_RECURSE
      level.children.push(evaluate(value, fields));
    }
    else {
      // code === CHILD_APPEND
      level.children.push(value);
    }
  }

  return level;
};


const CACHE = {};

// `statics` is tpl literal parts split by placeholders, eg. `a ${b} c` → [`a `, ` c`]
function html (statics) {
  const key = statics.join('')
  const tpl = CACHE[key] || (CACHE[key] = build(statics))
  return evaluate(tpl, arguments);
}

export default html;
