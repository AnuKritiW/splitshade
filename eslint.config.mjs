// @ts-check
/** @type {import('eslint').Linter.FlatConfig[]} */
import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vuePlugin from 'eslint-plugin-vue';
import tsdoc from 'eslint-plugin-tsdoc';

export default [
  // Ignore build artifacts
  { ignores: ['dist/**', 'node_modules/**'] },

  // Base JS recommendations
  js.configs.recommended,

  // ---------- TypeScript (*.ts, *.tsx) ----------
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    plugins: { '@typescript-eslint': tsPlugin, tsdoc },
    rules: {
      // TS recommended
      ...(tsPlugin.configs.recommended.rules ?? {}),

      // Keep TSDoc on
      'tsdoc/syntax': 'warn',

      // Calm the noise while you migrate
      // 'no-undef' is incorrect for TS (TS handles this)
      'no-undef': 'off',
      // Allow 'any' for now (flip to 'warn'/'error' later)
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow @ts-ignore for tests/hard cases (tighten later)
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },

  // ---------- Vue Single File Components (*.vue) ----------
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      // keep vue-eslint-parser from preset; add globals
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        // Enable TS in <script lang="ts">
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: { tsdoc },
    rules: {
      // Keep TSDoc checks available (rare in .vue but fine)
      'tsdoc/syntax': 'warn',

      // Relax Vue formatting/casing rules to match your current code
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/one-component-per-file': 'off',
      // TS handles prop types; don’t force runtime prop types
      'vue/require-prop-types': 'off'
    }
  },

  // ---------- Tests (Vitest/JSDOM) ----------
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}', '**/*.test.{ts,tsx,js,jsx}'],
    languageOptions: {
      // give describe/it/expect/vi/etc.
      globals: { ...globals.vitest, ...globals.browser, ...globals.node }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // Testing components often violate these stylistically
      'vue/one-component-per-file': 'off',
      'vue/require-prop-types': 'off'
    }
  }
];
