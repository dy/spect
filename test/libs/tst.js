import * as assert from './tst-assert.js'

const isNode = typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]'
const GREEN = '\u001b[32m', RED = '\u001b[31m', YELLOW = '\u001b[33m', RESET = '\u001b[0m', CYAN = '\u001b[36m'

let assertIndex = 0
let index = 1
let passed = 0
let failed = 0
let skipped = 0
let only = 0

let start
let queue = new Promise(resolve => start = resolve)

export default function test(name, fn) {
  if (!fn) return test.todo(name)
  return createTest({ name, fn })
}
test.todo = function (name, fn) {
  return createTest({ name, fn, todo: true, tag: 'todo' })
}
test.fixme = test.fix = function (name, fn) {
  return createTest({ name, fn, todo: true, tag: 'fixme' })
}
test.skip = function (name, fn) {
  return createTest({ name, fn, skip: true, tag: 'skip' })
}
test.only = function (name, fn) {
  only++
  return createTest({ name, fn, only: true, tag: 'only' })
}
test.node = function (name, fn) {
  return createTest({ name, fn, skip: !isNode, tag: 'node' })
}
test.browser = function (name, fn) {
  return createTest({ name, fn, skip: isNode, tag: 'browser' })
}
test.demo = function (name, fn) {
  return createTest({ name, fn, demo: true, tag: 'demo' })
}


export function createTest(test) {
  test.index = index++

  if (test.skip || test.todo) {
    queue = queue.then(() => {
      skipped++
      if (only && !test.only) return test
      isNode ?
        console.log(`${CYAN}» ${test.name}${test.tag ? ` (${test.tag})` : ''}${RESET}`) :
        console.log(`%c${test.name} ${test.todo ? '🚧' : '≫'}` + (test.tag ? ` (${test.tag})` : ''), 'color: #dadada')
      return test
    })
  }

  else {
    test = Object.assign({
      assertion: [],
      skip: false,
      todo: false,
      only: false,
      demo: false,
      end: () => { },
      log: (ok, operator, msg, info) => {
        assertIndex += 1
        if (ok) {
          isNode ?
            console.log(`${GREEN}√ ${assertIndex} — ${msg}${RESET}`) :
            console.log(`%c✔ ${assertIndex} — ${msg}`, 'color: #229944')
          if (!test.demo) {
            test.assertion.push({ idx: assertIndex, msg })
            passed += 1
          }
        } else {
          isNode ? (
            console.log(`${RED}× ${assertIndex} — ${msg}`),
            info && (
              console.info(`actual:${RESET}`, typeof info.actual === 'string' ? JSON.stringify(info.actual) : info.actual, RED),
              console.info(`expected:${RESET}`, typeof info.expected === 'string' ? JSON.stringify(info.expected) : info.expected, RED),
              console.error(new Error, RESET)
            )
          ) :
            info ? console.assert(false, `${assertIndex} — ${msg}${RESET}`, info, new Error) :
              console.assert(false, `${assertIndex} — ${msg}${RESET}`, new Error)
          if (!test.demo) {
            test.assertion.push({ idx: assertIndex, msg, info, error: new Error() })
            failed += 1
          }
        }
      }
    }, test, assert)

    queue = queue.then(async (prev) => {
      if (only && !test.only) { skipped++; return test }

      isNode ? console.log(`${RESET}${prev && (prev.skip || prev.todo) ? '\n' : ''}► ${test.name}${test.tag ? ` (${test.tag})` : ''}`) :
        console.group(test.name + (test.tag ? ` (${test.tag})` : ''))

      let result

      try {
        result = await test.fn(test)
        // let all planned errors to log
        await new Promise(r => setTimeout(r))
      }
      catch (e) {
        if (!test.demo) failed += 1

        // FIXME: this syntax is due to chrome not always able to grasp the stack trace from source maps
        console.error(RED + e.stack, RESET)
      }
      finally {
        if (!isNode) console.groupEnd()
        else console.log()
      }

      return test
    })
  }
}

// tests called via import() cause network delay, hopefully 100ms is ok
Promise.all([
  new Promise(resolve => (typeof setImmediate !== 'undefined' ? setImmediate : requestIdleCallback)(resolve)),
  new Promise(resolve => setTimeout(resolve, 100))
]).then(async () => {
  start()

  await queue

  // summary
  console.log(`---\n`)
  const total = passed + failed + skipped
  if (only) console.log(`# only ${only} cases`)
  console.log(`# total ${total}`)
  if (passed) console.log(`# pass ${passed}`)
  if (failed) console.log(`# fail ${failed}`)
  if (skipped) console.log(`# skip ${skipped}`)

  if (isNode) process.exit(failed ? 1 : 0)
})



