import { type Plugin } from 'esbuild'
import path from 'path'

import { getModules } from 'rollup-plugin-polyfill-node/dist/modules'
import POLYFILLS from 'rollup-plugin-polyfill-node/dist/polyfills'
const EMPTY = POLYFILLS['empty.js']

export type Options = {
  exclude?: string[]
  injectBuffer?: boolean
  injectProcess?: boolean
}

export default nodeBuiltin
export { nodeBuiltin }

function nodeBuiltin({
  exclude,
  injectBuffer = false, // why, huge size AND can not tree-shaking
  injectProcess = true,
}: Options = {}): Plugin {
  const PLUGIN_NAME = 'esbuild-node-builtin'

  const modules = getModules()

  // do not touch these modules
  exclude?.forEach((name) => {
    modules.delete(name)
  })

  return {
    name: PLUGIN_NAME,
    setup(build) {
      // builtin modules
      {
        // filter will use go regex
        // https://github.com/evanw/esbuild/issues/1634
        const filter = new RegExp(`^(node:)?(${Array.from(modules.keys()).join('|')})$`)
        const extractId = new RegExp(`^(node:)?(?<id>(${Array.from(modules.keys()).join('|')}))$`)
        build.onResolve({ filter }, (args) => {
          const match = extractId.exec(args.path)
          const id = match?.groups?.id as string
          return { namespace: PLUGIN_NAME, path: id }
        })

        build.onLoad({ namespace: PLUGIN_NAME, filter: /.*/ }, (args) => {
          const id = args.path
          if (modules.has(id)) {
            return { contents: modules.get(id) }
          } else {
            return { contents: EMPTY }
          }
        })
      }

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
