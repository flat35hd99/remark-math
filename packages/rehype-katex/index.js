const visit = require('unist-util-visit')
const katex = require('katex').renderToString
const unified = require('unified')
const parse = require('rehype-parse')
const toText = require('hast-util-to-text')

module.exports = rehypeKatex

const assign = Object.assign

const parseHtml = unified().use(parse, {fragment: true, position: false})

const source = 'rehype-katex'

function rehypeKatex(options) {
  const opts = options || {}
  const double = opts.inlineMathDoubleDisplay || false
  const throwOnError = opts.throwOnError || false

  return transformMath

  function transformMath(tree, file) {
    visit(tree, 'element', onelement)

    function onelement(element) {
      const tagName = element.tagName
      const classes = element.properties.className || []
      const inline = tagName === 'span' && classes.includes('math-inline')
      const displayMode =
        (double && tagName === 'span' && classes.includes('math-display')) ||
        (tagName === 'div' && classes.includes('math-display'))

      if (!inline && !displayMode) {
        return
      }

      const value = toText(element)

      let result

      try {
        result = katex(
          value,
          assign({}, options, {displayMode: displayMode, throwOnError: true})
        )
      } catch (error) {
        const fn = throwOnError ? 'fail' : 'message'
        const origin = [source, error.name.toLowerCase()].join(':')

        file[fn](error.message, element.position, origin)

        result = katex(
          value,
          assign({}, options, {
            displayMode: displayMode,
            throwOnError: false,
            strict: 'ignore'
          })
        )
      }

      element.children = parseHtml.parse(result).children
    }
  }
}
