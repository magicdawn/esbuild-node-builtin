import { type Plugin } from 'esbuild'
import path from 'path'
import debugFactory from 'debug'

import { getModules } from 'rollup-plugin-polyfill-node/dist/modules'
import POLYFILLS from 'rollup-plugin-polyfill-node/dist/polyfills'
const EMPTY = POLYFILLS['empty.js']

const debug = debugFactory('esbuild-node-builtin:index')

// e.g
// import * as _binding from '\0polyfill-node.__zlib-lib/binding';
// https://github.com/FredKSchott/rollup-plugin-polyfill-node/blob/main/polyfills/zlib.js#L23
const POLYFILL_NODE_PREFIX = '\0polyfill-node.'
const POLYFILL_NODE_FILTER = new RegExp(`^\\0polyfill-node\\.`)

export type NodeBuiltinOptions = {
  exclude?: string[]
  injectBuffer?: boolean
  injectProcess?: boolean
}

/* istanbul ignore next */
export default nodeBuiltin
export { nodeBuiltin }

function nodeBuiltin({
  exclude,
  injectBuffer = false, // why, huge size AND can not tree-shaking
  injectProcess = true,
}: NodeBuiltinOptions = {}): Plugin {
  const PLUGIN_NAME = 'esbuild-node-builtin'
  debug(
    'options: excude = %o, injectBuffer = %s, injectProcess = %s',
    exclude,
    injectBuffer,
    injectProcess
  )

  const modules = getModules()

  // do not touch these modules
  exclude?.forEach((name) => {
    modules.delete(name)
  })

  return {
    name: PLUGIN_NAME,
    setup(build) {
      // builtin modules
      // filter will use go regex
      // https://github.com/evanw/esbuild/issues/1634
      const filter = new RegExp(`^(node:)?(${Array.from(modules.keys()).join('|')})$`)
      const extractId = new RegExp(`^(node:)?(?<id>(${Array.from(modules.keys()).join('|')}))$`)
      debug('filter = %o', filter)
      build.onResolve({ filter }, (args) => {
        const match = extractId.exec(args.path)
        const id = match?.groups?.id as string
        debug('onResolve id = %s from %s', id, args.importer)
        return { namespace: PLUGIN_NAME, path: id }
      })

      build.onResolve({ filter: POLYFILL_NODE_FILTER }, (args) => {
        const id = args.path.slice(POLYFILL_NODE_PREFIX.length)
        debug('onResolve POLYFILL_NODE id = %s from %s', id, args.importer)
        return { namespace: PLUGIN_NAME, path: id }
      })

      build.onLoad({ namespace: PLUGIN_NAME, filter: /.*/ }, (args) => {
        const id = args.path
        debug('onLoad id = %s', id)

        if (modules.has(id)) {
          return { contents: modules.get(id) }
        }

        // e.g __zlib-lib/binding
        const key = id.endsWith('.js') ? id : id + '.js'
        if (POLYFILLS[key]) {
          let contents = POLYFILLS[key] as string

          // only this folder use `./xxx` relative import
          // transform to special prefix
          if (id.startsWith('__zlib-lib/')) {
            // from './relative' => from '\0polyfill-node.__zlib-lib/relative'
            contents = contents.replace(/from +['"]\.\/([\w_-]+?)['"]/g, (_, relativeName) => {
              return `from '${POLYFILL_NODE_PREFIX}__zlib-lib/${relativeName || ''}'`
            })
          }

          return { contents }
        }

        /* istanbul ignore next */
        return { contents: EMPTY }
      })

      build.initialOptions.inject = [
        ...(build.initialOptions.inject || []),
        ...([
          path.join(__dirname, '../inject/global.js'),
          injectProcess && path.join(__dirname, '../inject/process.js'),
          injectBuffer && path.join(__dirname, '../inject/buffer.js'),
        ].filter(Boolean) as string[]),
      ]
    },
  }
}
