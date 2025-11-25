const { defineSharedConfig } = require('@blich-studio/eslint-config')

module.exports = defineSharedConfig({
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
    },
  },
})
