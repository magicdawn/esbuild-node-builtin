import constants from 'constants'
import debugFactory from 'debug'
import esbuild, { Plugin } from 'esbuild'
import { readFileSync } from 'fs'
import os from 'os'
import { join } from 'path'
import { describe, expect, it, should } from 'vitest'
import vm from 'vm'
import nodeBuiltinDefaultExport, { NodeBuiltinOptions, nodeBuiltin } from '../src'

should()
const debug = debugFactory('esbuild-node-builtin:test')

const files = [
  'events.js',
  'crypto.js',
  'url-parse.js',
  'url-file-url-to-path.js',
  'url-format.js',
  'stream.js',
  'assert.js',
  'constants.js',
  'os.js',
  'path.js',
  'string-decoder.js',
  'zlib.js',
  'domain.js',
  'crypto.js',
]

async function buildFile(
  file: string,
  {
    logError = true,
    extraOptions,
    plugin,
  }: {
    logError?: boolean
    extraOptions?: Partial<NodeBuiltinOptions>
    plugin?: Plugin
  } = {}
) {
  const entry = join(__dirname, 'examples', file)
  const outfile = join(__dirname, 'fixtures-data', file)

  const entryCode = readFileSync(entry, 'utf-8')
  const hasBuffer = entryCode.includes('Buffer') || ['stream.js'].includes(file)

  debug('before build %s', file)
  await esbuild.build({
    entryPoints: [entry],
    plugins: [
      plugin ??
        nodeBuiltin({
          injectBuffer: hasBuffer,
          ...extraOptions,
        }),
    ],
    format: 'cjs',
    bundle: true,
    outfile,
    logLevel: logError ? undefined : 'silent',
  })

  const code = readFileSync(outfile, 'utf-8')
  return code
}

async function runCode(code: string) {
  return new Promise<void>((resolve, reject) => {
    const done = (err?: unknown) => {
      if (err) return reject(err)
      else resolve()
    }

    const script = new vm.Script(code)
    const context = vm.createContext({
      done, // it not part of `createContext`, it's called in example code
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      console: console,
      _constants: constants,
      _osEndianness: os.endianness(),
    })

    context.self = context
    script.runInContext(context)
  })
}

describe('examples code: bundle, run with vm module', () => {
  files.forEach((file) => {
    it(`RUN success: examples/${file}`, async function () {
      const code = await buildFile(file)
      await runCode(code)
    })
  })
})

describe('more cases', function () {
  it('works with special zlib', async () => {
    const code = await buildFile('demo-import-star.js')
    await runCode(code)
  })

  it('crypto option works (though is broken)', async () => {
    let err: Error | undefined
    try {
      await buildFile('crypto-broken.js', { logError: false })
    } catch (e) {
      err = e
    }

    // err.message === `"diffieHellman" is not exported by "\u0000polyfill-node.crypto.js", imported by "test/examples/crypto-broken.js".`
    // ERROR: No matching export in "esbuild-node-builtin:crypto" for import "diffieHellman"
    err!.should.be.ok
    err!.message.should.match(/No matching export/i)
    err!.message.includes('esbuild-node-builtin:crypto').should.be.true
    err!.message.includes('diffieHellman').should.be.true
  })

  it('exclude works', async () => {
    return expect(
      buildFile('assert.js', {
        logError: false,
        extraOptions: {
          exclude: ['assert'],
        },
      })
    ).rejects.toThrow(/ERROR: Could not resolve "assert"/i)
  })

  it('empty options should works', async () => {
    const code = await buildFile('assert.js', {
      logError: false,
      plugin: nodeBuiltinDefaultExport(),
    })
    await runCode(code)
  })
})
