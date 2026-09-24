import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'node_modules/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Apostrophes françaises dans les textes JSX : règle inadaptée ici.
      'react/no-unescaped-entities': 'off',
    },
  },
]);