const { base } = require('@blich-studio/eslint-config')

module.exports = base({
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
    },
  },
})
