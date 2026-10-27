import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

// Configuración mínima y enfocada:
//  - TypeScript (reglas recomendadas, sin type-checking pesado)
//  - react-hooks  → caza bugs en useEffect/useLayoutEffect (deps, orden de hooks)
//  - jsx-a11y     → accesibilidad (img sin alt, links sin texto, etc.)
// Todo en modo "warn": informa, no rompe el build. Para tipos sigue usando `npm run typecheck`.
export default tseslint.config(
  {
    // No analizar artefactos ni dependencias.
    ignores: ['dist', 'node_modules', 'dist-ssr', '*.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Hooks: lo más valioso para tu caso (carrusel, ResizeObserver, useHeaderHeight).
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
      // setState dentro de un effect: aquí son patrones intencionales (cerrar el
      // menú al navegar, carga progresiva del hero). Informa, no bloquea.
      'react-hooks/set-state-in-effect': 'warn',
      // Accesibilidad básica.
      ...jsxA11y.flatConfigs.recommended.rules,
      // autoFocus del buscador al abrir el drawer móvil: decisión de UX, solo aviso.
      'jsx-a11y/no-autofocus': 'warn',
      // Variables/imports sin usar → solo aviso; ignora los que empiezan con "_".
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
