import regexparam from 'regexparam'

export default function route(path) {
  let foo = regexparam(path)

  return (...args) => {
    let [path] = args
    let matches = param.pattern.exec(path)
  }
}
