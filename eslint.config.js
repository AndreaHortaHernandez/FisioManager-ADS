import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // El frontend (config orientada al navegador) no debe lintar el backend ni los builds.
  globalIgnores(['dist', '**/dist/**', 'backend']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Patrón de carga de datos usado en todo el proyecto: useEffect(() => { loadX() }, []).
      // Es intencional; lo dejamos como advertencia en lugar de error.
      'react-hooks/set-state-in-effect': 'warn',
      // Los catch vacíos de errores opcionales (p. ej. transcripción de audio) son intencionales.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
])
