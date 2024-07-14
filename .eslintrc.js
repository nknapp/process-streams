module.exports = {
  extends: 'standard',
  parserOptions: {
    ecmaVersion: 'latest'
  },
  overrides: [
    {
      files: ['src/**/*.js', 'test/**/*.js'],
      rules: {
        // process-streams@1.x still runs on very old node versions. We keep "var" even though
        // it is  deprecated
        'no-var': 'off',
        'no-restricted-syntax': [
          'error',
          "VariableDeclaration[kind='const']",
          "VariableDeclaration[kind='let']",
          'ArrowFunctionExpression',
          'Property[shorthand=true]'
        ],
        'object-shorthand': 'off'
      }
    },
    {
      files: ['test/**/*.js'],
      env: {
        mocha: true
      },
      rules: {
        // process-streams@1.x still runs on very old node versions. We keep "var" even though
        // it is  deprecated
        'no-var': 'off',
        'no-restricted-syntax': [
          'error',
          "VariableDeclaration[kind='const']",
          "VariableDeclaration[kind='let']",
          'ArrowFunctionExpression',
          'Property[shorthand=true]'
        ],
        'object-shorthand': 'off'
      }
    }
  ]
}
