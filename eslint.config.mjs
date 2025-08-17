// @ts-check
/** @type {import('eslint').Linter.FlatConfig[]} */
import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vuePlugin from 'eslint-plugin-vue';
import tsdoc from 'eslint-plugin-tsdoc';
import pluginImport from 'eslint-plugin-import';

export default [
  // Ignore build artifacts
  { ignores: ['dist/**', 'node_modules/**'] },

  // Base JS recommendations
  js.configs.recommended,

  // ---------- Import Organization (All Files) ----------
  {
    files: ['**/*.{ts,tsx,js,jsx,vue}'],
    plugins: { import: pluginImport },
    settings: {
      // Tell eslint-plugin-import how to resolve TS + Vue files
      'import/resolver': {
        typescript: {
          // Use root tsconfig.json which handles project references
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue'],
        },
      },
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue'],
      // (optional) parser mapping for .vue
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx', '.vue'],
      },
      'import/internal-regex': '^@/',
    },
    rules: {
      // Keep imports grouped and tidy (auto-fixable)
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'before' }, // put @/ first in "internal"
          { pattern: '@tests/**', group: 'internal', position: 'after' }, // put @tests/ after @/
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always',
      }],

      // Enforce clean paths
      'import/no-useless-path-segments': ['error', {
        noUselessIndex: true,
      }],
    },
  },

  // ---------- Source Code: Enforce @ alias usage ----------
  {
    files: ['src/**/*.{ts,tsx,js,jsx,vue}'],
    plugins: { import: pluginImport },
    rules: {
      // Prefer shorter paths and @ aliases
      'import/no-useless-path-segments': ['error', {
        noUselessIndex: true,
      }],

      // Discourage deep relative imports - prefer @ alias for cross-module imports
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../*/*', '../../*', '../../../*'],
            message: 'Prefer using @ alias imports (e.g., @/components/...) instead of deep relative imports (../../...)'
          }
        ]
      }],
    },
  },

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

      'no-trailing-spaces': 'error',

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

      'no-trailing-spaces': 'error',

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

  // ---------- Tests: Enforce alias usage ----------
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
    plugins: { import: pluginImport },
    rules: {
      // Encourage @tests/ for test utilities and @/ for source imports
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../utils/*', '../../utils/*', '../../../utils/*'],
            message: 'Prefer using @tests/ui/utils/... for test utilities instead of relative imports (../../utils/...)'
          },
          {
            group: ['../*/*', '../../*', '../../../*'],
            message: 'Prefer using @/ for source code imports or @tests/ for test utilities instead of deep relative imports'
          }
        ]
      }],
    },
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
