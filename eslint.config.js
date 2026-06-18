// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    ignores: ['**/README.md'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
)
