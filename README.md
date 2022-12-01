# esbuild-node-builtin

> esbuild plugin let u use node builtin modules

[![Build Status](https://img.shields.io/github/workflow/status/magicdawn/esbuild-node-builtin/ci/main.svg?style=flat-square)](https://github.com/magicdawn/esbuild-node-builtin/actions/workflows/ci.yml)
[![Coverage Status](https://img.shields.io/codecov/c/github/magicdawn/esbuild-node-builtin/main.svg?style=flat-square)](https://codecov.io/gh/magicdawn/esbuild-node-builtin)
[![npm version](https://img.shields.io/npm/v/esbuild-node-builtin.svg?style=flat-square)](https://www.npmjs.com/package/esbuild-node-builtin)
[![npm downloads](https://img.shields.io/npm/dm/esbuild-node-builtin.svg?style=flat-square)](https://www.npmjs.com/package/esbuild-node-builtin)
[![npm license](https://img.shields.io/npm/l/esbuild-node-builtin.svg?style=flat-square)](http://magicdawn.mit-license.org)

## Install

```sh
$ pnpm add -D esbuild-node-builtin
```

## Usage

```ts
import { nodeBuiltin } from 'esbuild-node-builtin'

esbuild.build({
  // blabla
  plugins: [nodeBuiltin()],
})
```

## Options

- `injectProcess`: use esbuild inject for `process` global reference, default `true`
- `injectBuffer`: use esbuild inject for `Buffer` global reference, default `false`, since this is big AND can not tree-shaking
- `exclude`: `string[]`, disable proxy some builtin module

## Why

there are existing packages

- https://github.com/FredKSchott/rollup-plugin-polyfill-node
- https://github.com/cyco130/esbuild-plugin-polyfill-node

AND

### rollup-plugin-polyfill-node

`rollup-plugin-polyfill-node` looks great, resolves to esm modules, and tree-shakable. but is for rollup.

### esbuild-plugin-polyfill-node

`esbuild-plugin-polyfill-node` a esbuild plugin, AND use browserify commonjs deps.
AND not tree-shakable

e.g

```ts
import { format } from 'util'
```

- this package & rollup-plugin-polyfill-node, other exports from util will not be included.
- esbuild-plugin-polyfill-node will include entire [util.js](https://unpkg.com/browse/util@0.12.5/util.js)

## Why depends on rollup

this package depends on rollup-plugin-polyfill-node, and use it's internal bundled polyfills.
the rollup dep is useless, just prevent error report.

## Changelog

[CHANGELOG.md](CHANGELOG.md)

## License

the MIT License http://magicdawn.mit-license.org
