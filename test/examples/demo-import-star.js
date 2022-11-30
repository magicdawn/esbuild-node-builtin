import * as _binding from '\0polyfill-node.__zlib-lib/binding'

const reexports = {}
Object.keys(_binding).forEach((k) => {
  reexports[k] = _binding[k]
})

done()
