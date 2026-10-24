import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.github/',
      'node_modules/',
      '**/*.d.ts',
      'index.js',
      'lib/**/*.js'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mts'],
    extends: [tseslint.configs.recommended],
    rules: {
      // Modules that use export = are imported with import = require() where
      // the import ends up in a declaration file, so consumers can read the
      // declarations without esModuleInterop.
      '@typescript-eslint/no-require-imports': [
        'error',
        { allowAsImport: true }
      ]
    }
  },
  {
    files: ['test/**/*.mts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.mocha }
    },
    rules: {
      // Chai assertions such as `expect(x).to.be.true` are expressions.
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
)
