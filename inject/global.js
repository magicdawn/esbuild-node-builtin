/* eslint-disable no-undef */

// reference
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
// https://github.com/zloirock/core-js/blob/8cc04e1986474d0fee290a0845506bafe55a082e/packages/core-js/internals/global.js
//
// other polyfills
// https://github.com/FredKSchott/rollup-plugin-polyfill-node/blob/main/polyfills/global.js
// https://github.com/cyco130/esbuild-plugin-polyfill-node/blob/main/polyfills/global.js
//
const globalObject = (() => {
  if (typeof globalThis === 'object' && globalThis) return globalThis
  if (typeof window === 'object' && window) return window
  if (typeof self === 'object' && self) return self
  if (typeof global === 'object' && global) return global
  return (
    (function () {
      return this
    })() || Function('return this')()
  )
})()

export { globalObject as global }

// rollup plugin use inject transform `__dirname` / `__filename` to
// a import statement, esbuild self can't do this without parse code
// just use the dummy default
export const __dirname = '/'
export const __filename = '/index.js'
