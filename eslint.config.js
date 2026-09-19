import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-server', '.wrangler']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: { react },
    rules: {
      ...react.configs.flat.recommended.rules,

      // Con jsx-uses-vars activo, ESLint ya sabe qué imports usa el JSX,
      // así que el varsIgnorePattern de antes deja de hacer falta.
      'no-unused-vars': 'error',

      // El proyecto usa el JSX transform nuevo: no hay que importar React
      // en cada archivo ni declarar propTypes.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Entrada del prerender: no es un módulo de componentes, Fast Refresh
  // no pinta nada aquí.
  {
    files: ['src/entry-server.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // Scripts de build: se ejecutan en Node, no en el navegador.
  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])