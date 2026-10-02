'use strict';
const js = require('@eslint/js');
const globals = require('globals');

// Standard-Konfiguration (wie Prompt Hub): Apps-Script-Code in src/ wird auf
// Syntax und echte Fehler geprueft. Alle .gs-Dateien teilen sich in Apps Script
// einen Namensraum, deshalb sind no-undef/no-unused-vars dort aus.
module.exports = [
  { ignores: ['node_modules/**', 'preview/**', 'docs/**', 'dist/**', 'test-results/**', 'tests-output/**', 'ci-output/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.gs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: {
      'no-undef': 'off', 'no-unused-vars': 'off', 'no-empty': 'off', 'no-useless-escape': 'off',
      'no-prototype-builtins': 'off', 'no-inner-declarations': 'off', 'no-cond-assign': 'off',
      'no-control-regex': 'off', 'no-misleading-character-class': 'off', 'no-case-declarations': 'off',
      'no-fallthrough': 'off', 'no-redeclare': 'off', 'no-useless-assignment': 'off', 'preserve-caught-error': 'off',
      'no-regex-spaces': 'off', 'no-unsafe-finally': 'off', 'no-self-assign': 'off', 'no-irregular-whitespace': 'off'
    }
  },
  {
    files: ['tools/**/*.js', 'tests/**/*.js', 'tests-ui/**/*.js', 'gemini-gem/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }], 'preserve-caught-error': 'off' }
  }
];
